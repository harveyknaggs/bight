import NextAuth, { type DefaultSession } from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "staff" | "client";
    } & DefaultSession["user"];
  }
}

const STAFF_EMAILS = (process.env.STAFF_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?sent=1",
    error: "/login",
  },
  providers: [
    Resend({
      from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
      apiKey: process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      // Pull role from DB; staff allowlist is enforced on user creation.
      const [row] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      session.user.role = (row?.role ?? "client") as "staff" | "client";
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Promote to staff on first sign-in if email is on the allowlist.
      if (user.email && user.id && STAFF_EMAILS.includes(user.email.toLowerCase())) {
        await db.update(users).set({ role: "staff" }).where(eq(users.id, user.id));
      }
    },
  },
});
