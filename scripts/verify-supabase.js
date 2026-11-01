const { createClient } = require("@supabase/supabase-js");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !service) {
    throw new Error("Faltan variables de entorno");
  }

  const publicClient = createClient(url, anon);
  const admin = createClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: productos, error: pErr } = await publicClient
    .from("productos")
    .select("id, nombre")
    .eq("activo", true)
    .limit(3);
  if (pErr) throw pErr;

  const { data: cfg, error: cErr } = await publicClient
    .from("configuracion_sitio")
    .select("nombre_negocio")
    .eq("id", 1)
    .maybeSingle();
  if (cErr) throw cErr;

  const { data: login, error: lErr } = await publicClient.auth.signInWithPassword({
    email: "admin@catalogo.local",
    password: "AdminCatalogo2026!",
  });
  if (lErr) throw lErr;

  const { data: admins, error: aErr } = await admin
    .from("admins")
    .select("user_id")
    .eq("user_id", login.user.id)
    .maybeSingle();
  if (aErr) throw aErr;

  // Intentar desactivar signup vía Management no disponible aquí;
  // documentar en salida.
  console.log(
    JSON.stringify(
      {
        ok: true,
        negocio: cfg?.nombre_negocio,
        productos_muestra: (productos || []).map((p) => p.nombre),
        admin_login: !!login.session,
        admin_en_tabla: !!admins,
        user_id: login.user.id,
        app_role: login.user.app_metadata?.role,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error("VERIFY_FAIL", e.message || e);
  process.exit(1);
});
