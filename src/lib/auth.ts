import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function isStaff() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("is_staff");
  return Boolean(data);
}

export async function requireStaff() {
  const user = await getUser();
  if (!user) redirect("/login");
  const staff = await isStaff();
  if (!staff) redirect("/my-demo");
  return user;
}

export async function requireClient() {
  const user = await getUser();
  if (!user) redirect("/login");
  const staff = await isStaff();
  if (staff) redirect("/dashboard");
  return user;
}
