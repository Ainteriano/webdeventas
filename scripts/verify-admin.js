const { Client } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Define DATABASE_URL en el entorno");
  }
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await c.connect();
  const id = "a080898e-1867-4839-a172-248b7e60b98b";
  const ident = await c.query(
    "select id, provider, provider_id from auth.identities where user_id = $1",
    [id]
  );
  console.log("identities", ident.rows);
  if (!ident.rows.length) {
    await c.query(
      `insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), $1::uuid,
        jsonb_build_object('sub', $1::text, 'email', 'admin@catalogo.local'),
        'email', $1::text, now(), now(), now()
      )`,
      [id]
    );
    console.log("identity_created");
  }
  const adm = await c.query("select user_id from public.admins");
  console.log("admins", adm.rows);
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
