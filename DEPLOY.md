# Deploy en un solo flujo (Supabase + Vercel)

Repo: https://github.com/AbduInteriano/websiteventas

## A. Supabase (una vez)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. SQL Editor → ejecuta en orden:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_rls.sql`
   - `supabase/migrations/003_functions.sql`
   - `supabase/migrations/004_storage.sql`
   - `supabase/migrations/005_grants.sql`
3. Auth → Providers → Email ON  
   Auth → Settings → **Disable** “Allow new users to sign up”.
4. Authentication → Users → Add user (tu admin).
5. SQL:

```sql
INSERT INTO admins (user_id) VALUES ('UUID-DEL-USUARIO-ADMIN');
```

6. (Opcional) App Metadata del usuario: `{ "role": "admin" }`.
7. Copia de Settings → API:
   - Project URL
   - `anon` key
   - `service_role` key

## B. Vercel (conectado al repo)

1. [vercel.com/new](https://vercel.com/new) → Import **AbduInteriano/websiteventas**.
2. Framework: **Next.js** (auto).
3. Environment Variables (Production + Preview):

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (**solo server**) |
| `ADMIN_PATH` | `/gestion-privada` |
| `NEXT_PUBLIC_SITE_URL` | `https://tu-dominio.vercel.app` (luego el dominio real) |
| `RESEND_API_KEY` | (opcional) |
| `EMAIL_FROM` | (opcional) |
| `OWNER_EMAIL` | (opcional) |

4. Deploy.
5. Supabase → Authentication → URL Configuration:
   - Site URL = tu URL de Vercel
   - Redirect URLs = `https://tu-dominio.vercel.app/**`
6. Seed de datos:

```bash
# local, con .env.local apuntando al proyecto real
npm run seed
```

O pega `supabase/seed.sql` en el SQL Editor.

## C. Dominio (opcional)

Vercel → Project → Settings → Domains → agrega tu dominio → actualiza `NEXT_PUBLIC_SITE_URL`.

## Checklist rápido

- [ ] Migraciones aplicadas
- [ ] Signup público desactivado
- [ ] Usuario admin + fila en `admins`
- [ ] Buckets `productos` y `comprobantes` (migración 004)
- [ ] Variables en Vercel
- [ ] Deploy OK
- [ ] Login en `/gestion-privada/login`
- [ ] Seed / productos visibles en `/catalogo`
