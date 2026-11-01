const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const r = await c.query(
    `update pedidos
     set estado = 'CANCELADO',
         motivo_rechazo = 'Pedido de prueba duplicado / incompleto'
     where estado = 'PENDIENTE_PAGO'
       and stock_reservado = false
     returning codigo, estado`
  );
  console.log("cancelados", r.rows);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
