/**
 * Aplica migración talla, stock=1 en todos los productos y limpia pedidos de prueba.
 * Uso: DATABASE_URL=... node scripts/cleanup-stock-talla.js
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Define DATABASE_URL en el entorno");
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const migration = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "migrations", "007_talla.sql"),
    "utf8"
  );
  await client.query(migration);
  console.log("Migración 007_talla aplicada");

  const delItems = await client.query("DELETE FROM pedido_items");
  const delPedidos = await client.query("DELETE FROM pedidos");
  console.log("Items borrados:", delItems.rowCount);
  console.log("Pedidos borrados:", delPedidos.rowCount);

  const stock = await client.query(
    "UPDATE productos SET stock = 1 RETURNING id"
  );
  console.log("Productos con stock=1:", stock.rowCount);

  const counts = await client.query(`
    SELECT
      (SELECT count(*)::int FROM productos) AS productos,
      (SELECT count(*)::int FROM pedidos) AS pedidos,
      (SELECT count(*)::int FROM pedido_items) AS items
  `);
  console.log(counts.rows[0]);

  await client.end();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
