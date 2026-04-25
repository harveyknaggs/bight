import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireStaff() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "staff") redirect("/my-demo");
  return session.user;
}

export async function requireClient() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "staff") redirect("/dashboard");
  return session.user;
}
