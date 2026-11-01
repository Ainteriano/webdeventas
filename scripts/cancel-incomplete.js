const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i),
        l.slice(i + 1).replace(/^["']|["']$/g, ""),
      ];
    })
);

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  const { data, error } = await admin
    .from("pedidos")
    .update({
      estado: "CANCELADO",
      motivo_rechazo: "Intento incompleto (sin comprobante)",
    })
    .eq("estado", "PENDIENTE_PAGO")
    .eq("stock_reservado", false)
    .select("id, codigo");

  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log("Cancelados incompletos:", (data || []).length, data);
})();
