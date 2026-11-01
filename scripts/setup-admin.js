const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,

    ssl: { rejectUnauthorized: false },
  });

  if (!process.env.DATABASE_URL) {
    throw new Error("Define DATABASE_URL en el entorno");
  }

  await client.connect();

  const email = process.env.ADMIN_EMAIL || "admin@catalogo.local";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("Define ADMIN_PASSWORD en el entorno");
  }

  const existing = await client.query(
    "select id from auth.users where email = $1",
    [email]
  );

  let userId;
  if (existing.rows.length) {
    userId = existing.rows[0].id;
    await client.query(
      `update auth.users
       set encrypted_password = crypt($2, gen_salt('bf')),
           raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb,
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
       where id = $1`,
      [userId, password]
    );
    console.log("ADMIN_UPDATED", userId);
  } else {
    const r = await client.query(
      `insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at, confirmation_token, email_change,
        email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        $1,
        crypt($2, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"],"role":"admin"}'::jsonb,
        '{}'::jsonb,
        now(), now(), '', '', '', ''
      ) returning id`,
      [email, password]
    );
    userId = r.rows[0].id;

    await client.query(
      `insert into auth.identities (
        id, user_id, identity_data, provider, provider_id,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), $1::uuid,
        jsonb_build_object('sub', $1::text, 'email', $2::text),
        'email', $1::text, now(), now(), now()
      )`,
      [userId, email]
    );
    console.log("ADMIN_CREATED", userId);
  }

  await client.query(
    "insert into public.admins (user_id) values ($1) on conflict do nothing",
    [userId]
  );

  console.log(
    JSON.stringify({
      ok: true,
      email,
      password,
      userId,
      loginPath: "/gestion-privada/login",
    })
  );

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
