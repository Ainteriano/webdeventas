/**
 * Borra todos los pedidos/items/comprobantes. Deja productos intactos.
 * Uso: DATABASE_URL=... node scripts/clean-pedidos.js
 */
const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Define DATABASE_URL");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Faltan env de Supabase");
  }

  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  const items = await c.query("DELETE FROM pedido_items");
  const pedidos = await c.query("DELETE FROM pedidos");
  const counts = await c.query(`
    SELECT
      (SELECT count(*)::int FROM pedidos) AS pedidos,
      (SELECT count(*)::int FROM pedido_items) AS items,
      (SELECT count(*)::int FROM productos) AS productos
  `);
  console.log("Items borrados:", items.rowCount);
  console.log("Pedidos borrados:", pedidos.rowCount);
  console.log(counts.rows[0]);
  await c.end();

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  async function listAll(prefix = "") {
    const { data, error } = await sb.storage
      .from("comprobantes")
      .list(prefix, { limit: 100 });
    if (error) throw error;
    const paths = [];
    for (const f of data || []) {
      const p = prefix ? `${prefix}/${f.name}` : f.name;
      if (f.id) paths.push(p);
      else paths.push(...(await listAll(p)));
    }
    return paths;
  }

  const paths = await listAll();
  console.log("Comprobantes en storage:", paths.length);
  if (paths.length) {
    const { data, error } = await sb.storage.from("comprobantes").remove(paths);
    console.log("Comprobantes eliminados:", data?.length || 0, error?.message || "ok");
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
