// One-off script: walk the scraper output folders and upsert each lead into the DB.
// Run from D:\bight with:  npm run sync
// Reads SCRAPER_NICHES_DIR and DATABASE_URL from .env.local.

import "dotenv/config";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { niches, leads, reviews } from "../src/db/schema";

const NICHES_DIR = process.env.SCRAPER_NICHES_DIR;
if (!NICHES_DIR) {
  console.error("SCRAPER_NICHES_DIR not set. Add it to .env.local.");
  process.exit(1);
}

type RawLead = {
  name: string;
  google_place_id: string;
  google_place_url?: string | null;
  phone?: string | null;
  email?: string | null;
  full_address?: string | null;
  suburb?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  website?: string | null;
  has_website?: boolean;
  google_rating?: number | null;
  review_count?: number | null;
  category?: string | null;
  working_hours?: string | null;
  google_description?: string | null;
  google_photos?: string[];
  website_crawl?: {
    success?: boolean;
    skipped?: boolean;
    logo_url?: string | null;
    brand_colors?: string[];
    page_text_snippet?: string | null;
    social_links?: Record<string, string>;
    issues?: string[];
  };
};

async function isDir(path: string) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function upsertNiche(city: string, slug: string) {
  const inserted = await db
    .insert(niches)
    .values({ city, slug })
    .onConflictDoNothing({ target: [niches.city, niches.slug] })
    .returning({ id: niches.id });
  if (inserted[0]) return inserted[0].id;
  const [existing] = await db
    .select({ id: niches.id })
    .from(niches)
    .where(and(eq(niches.city, city), eq(niches.slug, slug)))
    .limit(1);
  return existing!.id;
}

function parseReviewMd(text: string) {
  // Best-effort: pull common sections. The format isn't strict, so we capture by H2 headings.
  const sections: Record<string, string> = {};
  const lines = text.split(/\r?\n/);
  let current = "";
  let buffer: string[] = [];
  const flush = () => {
    if (current) sections[current] = buffer.join("\n").trim();
    buffer = [];
  };
  for (const line of lines) {
    const heading = line.match(/^##\s+(.+?)\s*$/);
    if (heading) {
      flush();
      current = heading[1].toLowerCase();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return {
    designAngle: sections["design angle"] ?? sections["design"] ?? null,
    missingData: sections["missing data"] ?? sections["missing"] ?? null,
    bookingFallback: sections["booking fallback"] ?? sections["booking"] ?? null,
    coldEmailDraft: sections["cold email draft"] ?? sections["cold email"] ?? null,
    notes: sections["notes"] ?? null,
  };
}

async function syncLead(opts: {
  cityPath: string;
  city: string;
  nicheSlug: string;
  nicheId: string;
  bizSlug: string;
}) {
  const bizPath = join(opts.cityPath, opts.nicheSlug, opts.bizSlug);
  const dataPath = join(bizPath, "data.json");
  if (!(await fileExists(dataPath))) return null;

  const raw = JSON.parse(await readFile(dataPath, "utf-8")) as RawLead;
  if (!raw.google_place_id) return null;

  const values = {
    nicheId: opts.nicheId,
    googlePlaceId: raw.google_place_id,
    folderSlug: opts.bizSlug,
    name: raw.name,
    category: raw.category ?? null,
    phone: raw.phone ?? null,
    email: raw.email ?? null,
    website: raw.website ?? null,
    hasWebsite: Boolean(raw.has_website),
    fullAddress: raw.full_address ?? null,
    suburb: raw.suburb ?? null,
    postalCode: raw.postal_code ?? null,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    googleRating: raw.google_rating != null ? String(raw.google_rating) : null,
    reviewCount: raw.review_count ?? null,
    googleDescription: raw.google_description ?? null,
    workingHours: raw.working_hours ?? null,
    brandColors: raw.website_crawl?.brand_colors ?? null,
    logoUrl: raw.website_crawl?.logo_url ?? null,
    socialLinks: raw.website_crawl?.social_links ?? null,
    siteTextSnippet: raw.website_crawl?.page_text_snippet ?? null,
    siteIssues: raw.website_crawl?.issues ?? null,
    googlePhotos: raw.google_photos ?? null,
    googlePlaceUrl: raw.google_place_url ?? null,
  };

  const inserted = await db
    .insert(leads)
    .values(values)
    .onConflictDoUpdate({
      target: leads.googlePlaceId,
      set: {
        nicheId: values.nicheId,
        folderSlug: values.folderSlug,
        name: values.name,
        category: values.category,
        phone: values.phone,
        email: values.email,
        website: values.website,
        hasWebsite: values.hasWebsite,
        fullAddress: values.fullAddress,
        suburb: values.suburb,
        postalCode: values.postalCode,
        latitude: values.latitude,
        longitude: values.longitude,
        googleRating: values.googleRating,
        reviewCount: values.reviewCount,
        googleDescription: values.googleDescription,
        workingHours: values.workingHours,
        brandColors: values.brandColors,
        logoUrl: values.logoUrl,
        socialLinks: values.socialLinks,
        siteTextSnippet: values.siteTextSnippet,
        siteIssues: values.siteIssues,
        googlePhotos: values.googlePhotos,
        googlePlaceUrl: values.googlePlaceUrl,
        updatedAt: new Date(),
      },
    })
    .returning({ id: leads.id });

  const leadId = inserted[0]!.id;

  // Insert review row from review.md if present and we don't already have one for this lead.
  const reviewPath = join(bizPath, "review.md");
  if (await fileExists(reviewPath)) {
    const existingReview = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.leadId, leadId))
      .limit(1);
    if (existingReview.length === 0) {
      const reviewText = await readFile(reviewPath, "utf-8");
      const parsed = parseReviewMd(reviewText);
      await db.insert(reviews).values({
        leadId,
        designAngle: parsed.designAngle,
        missingData: parsed.missingData,
        bookingFallback: parsed.bookingFallback,
        coldEmailDraft: parsed.coldEmailDraft,
        notes: parsed.notes,
      });
    }
  }

  return leadId;
}

async function main() {
  console.log(`Syncing from ${NICHES_DIR}`);
  let synced = 0;
  let skipped = 0;

  const cities = await readdir(NICHES_DIR!);
  for (const city of cities) {
    const cityPath = join(NICHES_DIR!, city);
    if (!(await isDir(cityPath))) continue;

    const nichesInCity = await readdir(cityPath);
    for (const nicheSlug of nichesInCity) {
      const nichePath = join(cityPath, nicheSlug);
      if (!(await isDir(nichePath))) continue;

      const nicheId = await upsertNiche(city, nicheSlug);
      console.log(`  niche: ${city}/${nicheSlug}`);

      const businesses = await readdir(nichePath);
      for (const bizSlug of businesses) {
        if (!(await isDir(join(nichePath, bizSlug)))) continue;
        try {
          const id = await syncLead({ cityPath, city, nicheSlug, nicheId, bizSlug });
          if (id) {
            console.log(`    ✓ ${bizSlug}`);
            synced++;
          } else {
            console.log(`    - ${bizSlug} (no data.json or no place id)`);
            skipped++;
          }
        } catch (e) {
          console.error(`    x ${bizSlug}:`, (e as Error).message);
          skipped++;
        }
      }
    }
  }

  console.log(`\nDone. Synced ${synced}, skipped ${skipped}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
