// Seed top-demo URLs and stages for niches that have a flagship built and
// deployed under bight's /public/my-site/. Idempotent: safe to re-run.
//
// Run from D:\bight with:  npm run seed:top-demos

import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { niches } from "../src/db/schema";

type SeedSpec = {
  city: string;
  slug: string;
  topDemoUrl: string;
  topDemoStage: "not_started" | "building" | "reviewed" | "live";
  topDemoDesignAngle?: string;
};

const SEEDS: SeedSpec[] = [
  {
    city: "christchurch",
    slug: "hairdressers",
    topDemoUrl: "/my-site/v2/afg/index.html",
    topDemoStage: "live",
    topDemoDesignAngle:
      "AFG-style interactive flagship: video hero, scroll-pinned stage2, salon imagery.",
  },
];

async function seedOne(spec: SeedSpec) {
  const [niche] = await db
    .select({ id: niches.id, name: niches.slug })
    .from(niches)
    .where(and(eq(niches.city, spec.city), eq(niches.slug, spec.slug)))
    .limit(1);

  if (!niche) {
    console.warn(
      `  skip: niche '${spec.city}/${spec.slug}' not found - run npm run sync first`
    );
    return;
  }

  await db
    .update(niches)
    .set({
      topDemoUrl: spec.topDemoUrl,
      topDemoStage: spec.topDemoStage,
      topDemoDesignAngle: spec.topDemoDesignAngle ?? null,
      topDemoBuiltAt: new Date(),
      ...(spec.topDemoStage === "reviewed" || spec.topDemoStage === "live"
        ? { topDemoReviewedAt: new Date() }
        : {}),
    })
    .where(eq(niches.id, niche.id));

  console.log(
    `  ✓ ${spec.city}/${spec.slug} -> ${spec.topDemoUrl} (${spec.topDemoStage})`
  );
}

async function main() {
  console.log("Seeding niche top demos:");
  for (const spec of SEEDS) {
    await seedOne(spec);
  }
  console.log("\nDone.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
