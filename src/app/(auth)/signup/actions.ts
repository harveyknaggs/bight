"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { signIn } from "@/auth";

const STAFF_EMAILS = (process.env.STAFF_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/signup?error=missing");
  if (password.length < 8) redirect("/signup?error=short");

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) redirect("/signup?error=taken");

  const passwordHash = await bcrypt.hash(password, 12);
  const role = STAFF_EMAILS.includes(email) ? "staff" : "client";

  await db.insert(users).values({
    email,
    name,
    passwordHash,
    role,
  });

  // Sign them in straight away.
  await signIn("credentials", { email, password, redirect: false });
  redirect("/");
}
