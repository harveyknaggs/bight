"use server";

import { signIn } from "@/auth";

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    throw new Error("Email is required");
  }
  await signIn("resend", {
    email,
    redirect: true,
    redirectTo: "/",
  });
}
