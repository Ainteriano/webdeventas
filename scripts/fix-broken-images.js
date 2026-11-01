const { createClient } = require("@supabase/supabase-js");

const FIXES = [
  {
    old: "https://images.unsplash.com/photo-1514989940723-808ba2819160?w=800",
    neu: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800",
    nombre: "Tenis Escolar Niño",
  },
  {
    old: "https://images.unsplash.com/photo-1614252231338-cb0b195750f0?w=800",
    neu: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800",
    nombre: "Zapato Casual Oxford Hombre",
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan env de Supabase");

  const sb = createClient(url, key);
  for (const f of FIXES) {
    const { data, error } = await sb
      .from("producto_imagenes")
      .update({ url: f.neu })
      .eq("url", f.old)
      .select("id");
    if (error) throw error;
    console.log(f.nombre, "updated", data?.length || 0);
  }

  // Verificar
  const { data: all } = await sb.from("producto_imagenes").select("url");
  for (const img of all || []) {
    const r = await fetch(img.url, { method: "HEAD" });
    console.log(r.status, img.url.slice(0, 70));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
