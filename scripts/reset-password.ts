// Reset a user's password by email.
// Usage: npm run reset-password -- <email> <newPassword>

import "dotenv/config";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../src/db";
import { users } from "../src/db/schema";

async function main() {
  const [email, newPassword] = process.argv.slice(2);
  if (!email || !newPassword) {
    console.error("Usage: tsx scripts/reset-password.ts <email> <newPassword>");
    process.exit(1);
  }

  const [user] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.error(`No user found with email '${email}'.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));

  console.log(`✓ Password reset for ${email} (role: ${user.role}).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
