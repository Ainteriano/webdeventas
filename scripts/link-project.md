# Proyecto Supabase vinculado

- URL: `https://vlgfmiqzeepotipgszrm.supabase.co`
- Ref: `vlgfmiqzeepotipgszrm`
- Migraciones 001–005 aplicadas
- Buckets: `productos` (público), `comprobantes` (privado)
- Seed: 3 categorías, 10 productos
- Admin Auth creado (ver chat / setup-admin)

## Claves API (pegar en `.env.local` y Vercel)

Dashboard → Project Settings → API:

1. `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. `service_role` `secret` → `SUPABASE_SERVICE_ROLE_KEY`

También: Authentication → Providers → Email ON  
Authentication → Settings → **Disable sign-ups**
