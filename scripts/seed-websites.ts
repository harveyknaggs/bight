// Seed website rows for clients who have a built demo site hosted under
// bight's own /public/my-site/ path. Idempotent: safe to re-run.
//
// Run from D:\bight with:  npm run seed:websites

import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { leads, websites } from "../src/db/schema";

type SeedSpec = {
  folderSlug: string;
  demoUrl: string;
  templateUsed: string;
};

const SEEDS: SeedSpec[] = [
  {
    folderSlug: "afg-barbers-studio",
    demoUrl: "/my-site/v2/afg/",
    templateUsed: "v2",
  },
];

async function seedOne(spec: SeedSpec) {
  const [lead] = await db
    .select({ id: leads.id, name: leads.name })
    .from(leads)
    .where(eq(leads.folderSlug, spec.folderSlug))
    .limit(1);
  if (!lead) {
    console.warn(`  skip: lead with folder_slug='${spec.folderSlug}' not found - run npm run sync first`);
    return;
  }

  const [existing] = await db
    .select({ id: websites.id })
    .from(websites)
    .where(eq(websites.leadId, lead.id))
    .limit(1);

  if (existing) {
    await db
      .update(websites)
      .set({
        status: "built",
        demoUrl: spec.demoUrl,
        templateUsed: spec.templateUsed,
        builtAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(websites.id, existing.id));
    console.log(`  ✓ ${lead.name} (updated) -> ${spec.demoUrl}`);
  } else {
    await db.insert(websites).values({
      leadId: lead.id,
      status: "built",
      demoUrl: spec.demoUrl,
      templateUsed: spec.templateUsed,
      builtAt: new Date(),
    });
    console.log(`  ✓ ${lead.name} (created) -> ${spec.demoUrl}`);
  }
}

async function main() {
  console.log("Seeding website rows:");
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
