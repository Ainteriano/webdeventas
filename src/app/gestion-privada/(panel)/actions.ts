"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminPath } from "@/lib/admin";

export async function logoutAdmin() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect(`${getAdminPath()}/login`);
}
