// Seed two demo client accounts: AFG and Blackbeard.
// Idempotent: re-running updates the lead linkage and re-hashes the password.
// Use the printed credentials to log in at /login (in incognito) to preview the portal.

import "dotenv/config";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../src/db";
import { users, clients, leads } from "../src/db/schema";

type SeedSpec = {
  // Match by exact folder slug (the same value the sync script writes to leads.folder_slug).
  folderSlug: string;
  loginEmail: string;
  contactName: string;
  password: string;
};

const SEEDS: SeedSpec[] = [
  {
    folderSlug: "afg-barbers-studio",
    loginEmail: "afg-test@bight.local",
    contactName: "AFG Barbers Studio",
    password: "afg-demo-12345",
  },
  {
    folderSlug: "blackbeard-lounge-barbershop-in-rolleston",
    loginEmail: "blackbeard-test@bight.local",
    contactName: "Blackbeard Lounge",
    password: "blackbeard-demo-12345",
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

  const passwordHash = await bcrypt.hash(spec.password, 12);

  // Upsert user by email.
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, spec.loginEmail))
    .limit(1);

  let userId: string;
  if (existingUser) {
    userId = existingUser.id;
    await db
      .update(users)
      .set({ name: spec.contactName, passwordHash, role: "client" })
      .where(eq(users.id, userId));
  } else {
    const [created] = await db
      .insert(users)
      .values({
        email: spec.loginEmail,
        name: spec.contactName,
        passwordHash,
        role: "client",
      })
      .returning({ id: users.id });
    userId = created.id;
  }

  // Upsert client row by lead_id (clients.lead_id is unique).
  const [existingClient] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.leadId, lead.id))
    .limit(1);

  if (existingClient) {
    await db
      .update(clients)
      .set({
        userId,
        contactName: spec.contactName,
        contactEmail: spec.loginEmail,
        signedUpAt: new Date(),
        plan: "free",
      })
      .where(eq(clients.id, existingClient.id));
  } else {
    await db.insert(clients).values({
      leadId: lead.id,
      userId,
      contactName: spec.contactName,
      contactEmail: spec.loginEmail,
      signedUpAt: new Date(),
      plan: "free",
    });
  }

  console.log(`  ✓ ${lead.name}`);
  console.log(`      login: ${spec.loginEmail}`);
  console.log(`      pass:  ${spec.password}`);
}

async function main() {
  console.log("Seeding demo client accounts:");
  for (const spec of SEEDS) {
    await seedOne(spec);
  }
  console.log("\nDone. Sign in at /login in incognito to preview each portal.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
