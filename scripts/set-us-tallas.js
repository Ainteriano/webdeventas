const { Client } = require("pg");

/** Tallas americanas: número + M (Men) / W (Woman) */
const tallas = {
  "Zapato Casual Oxford Hombre": "9M",
  "Tenis Deportivo Hombre Runner": "8M",
  "Tacón Elegante Mujer": "7W",
  "Sandalia Plana Mujer": "6W",
  "Tenis Escolar Niño": "5M",
  "Zapato Formal Niño": "5M",
  "Ballerina Niña Rosa": "5W",
  "Sandalia Niña Verano": "5W",
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

  await c.end();
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
