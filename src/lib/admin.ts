import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export function getAdminPath(): string {
  const path = process.env.ADMIN_PATH || "/gestion-privada";
  return path.startsWith("/") ? path : `/${path}`;
}

export function isAdminUser(user: User | null): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role;
  return role === "admin";
}

export async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false as const };
  }

  if (isAdminUser(user)) {
    return { user, isAdmin: true as const };
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    return { user, isAdmin: !!data };
  } catch {
    return { user, isAdmin: false as const };
  }
}
