import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: isStaff } = await supabase.rpc("is_staff");
  redirect(isStaff ? "/dashboard" : "/my-demo");
}
