const { Client } = require("pg");

const tallas = {
  "Zapato Casual Oxford Hombre": "42",
  "Tenis Deportivo Hombre Runner": "41",
  "Tacón Elegante Mujer": "37",
  "Sandalia Plana Mujer": "38",
  "Tenis Escolar Niño": "32",
  "Zapato Formal Niño": "33",
  "Ballerina Niña Rosa": "30",
  "Sandalia Niña Verano": "31",
};

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("Define DATABASE_URL");
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();

  for (const [nombre, talla] of Object.entries(tallas)) {
    const r = await c.query(
      "update productos set talla = $1 where nombre = $2 returning nombre, talla",
      [talla, nombre]
    );
    console.log(r.rows[0] || { nombre, skipped: true });
  }

  try {
    const files = await c.query(
      "select count(*)::int as n from storage.objects where bucket_id = 'comprobantes'"
    );
    console.log("comprobantes en storage:", files.rows[0].n);
    if (files.rows[0].n > 0) {
      await c.query(
        "delete from storage.objects where bucket_id = 'comprobantes'"
      );
      console.log("comprobantes storage limpiados");
    }
  } catch (e) {
    console.log("storage skip:", e.message);
  }

  await c.end();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
