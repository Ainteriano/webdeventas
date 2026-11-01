"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminPath, isAdminUser } from "@/lib/admin";
import { loginSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export async function loginAdmin(
  formData: FormData
): Promise<{ error?: string; redirectTo?: string } | undefined> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Correo o contraseña inválidos." };
  }

  const { email, password } = parsed.data;
  const h = headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  const rl = rateLimit(`admin-login:${ip}:${email.toLowerCase()}`, 5, 60_000);
  if (!rl.ok) {
    return {
      error: `Demasiados intentos. Espera ${rl.retryAfterSec}s.`,
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Credenciales incorrectas." };
  }

  let isAdmin = isAdminUser(data.user);
  if (!isAdmin) {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    isAdmin = !!row;
  }

  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "No tienes permiso de administrador." };
  }

  return { redirectTo: getAdminPath() };
}
