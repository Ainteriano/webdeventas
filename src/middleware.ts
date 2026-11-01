import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function getAdminPath(): string {
  const path = process.env.ADMIN_PATH || "/gestion-privada";
  return path.startsWith("/") ? path : `/${path}`;
}

export async function middleware(request: NextRequest) {
  const adminPath = getAdminPath();
  const { pathname } = request.nextUrl;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  const { supabase, user, supabaseResponse } = await updateSession(request);

  const isAdminRoute =
    pathname === adminPath || pathname.startsWith(`${adminPath}/`);
  const isLoginRoute = pathname === `${adminPath}/login`;

  if (!isAdminRoute) {
    return supabaseResponse;
  }

  // Login page: si ya es admin, redirigir al dashboard
  if (isLoginRoute) {
    if (user) {
      const role = user.app_metadata?.role;
      let isAdmin = role === "admin";
      if (!isAdmin) {
        const { data } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        isAdmin = !!data;
      }
      if (isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = adminPath;
        return NextResponse.redirect(url);
      }
    }
    return supabaseResponse;
  }

  // Rutas protegidas del panel
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = `${adminPath}/login`;
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const role = user.app_metadata?.role;
  let isAdmin = role === "admin";
  if (!isAdmin) {
    const { data } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = !!data;
  }

  if (!isAdmin) {
    const url = request.nextUrl.clone();
    url.searchParams.set("error", "no_autorizado");
    url.pathname = `${adminPath}/login`;
    // Cerrar sesión de no-admin
    await supabase.auth.signOut();
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
