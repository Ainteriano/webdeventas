# Catálogo de Ventas

Tienda web lista para producción: Next.js 14 (App Router) + Supabase + Vercel.  
Interfaz en español, panel admin privado, checkout por transferencia con comprobante y estructura lista para link de pago.

## Stack

- Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Supabase (Postgres, Auth, Storage, RLS)
- `@supabase/ssr` para sesión en middleware/servidor
- Zod + React Hook Form
- Zustand (carrito + localStorage)
- Resend (correos transaccionales)

## 1. Crear proyecto en Supabase

1. Entra a [https://supabase.com](https://supabase.com) y crea un proyecto.
2. Guarda **Project URL**, **anon key** y **service_role key** (Settings → API).
3. En Authentication → Providers: deja Email habilitado.
4. En Authentication → Settings: **desactiva** “Allow new users to sign up” (registro público deshabilitado).

## 2. Migraciones y buckets

Instala [Supabase CLI](https://supabase.com/docs/guides/cli) y enlaza el proyecto:

```bash
npm i -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

O ejecuta manualmente en el SQL Editor, en orden:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_functions.sql`
4. `supabase/migrations/004_storage.sql`
5. `supabase/migrations/005_grants.sql`

La migración `004_storage.sql` crea los buckets:

| Bucket         | Público | Uso                          |
|----------------|---------|------------------------------|
| `productos`    | Sí      | Imágenes del catálogo        |
| `comprobantes` | No      | Comprobantes de transferencia |

## 3. Crear usuario admin

1. En Supabase → Authentication → Users → **Add user** (correo + contraseña).
2. Copia el `user_id` (UUID).
3. En SQL Editor:

```sql
INSERT INTO admins (user_id) VALUES ('UUID-DEL-USUARIO');

-- Opcional pero recomendado: claim en app_metadata
-- (Dashboard → Users → usuario → App Metadata)
-- { "role": "admin" }
```

Con Admin API:

```bash
# Ejemplo con service role (Node)
# supabase.auth.admin.updateUserById(id, { app_metadata: { role: 'admin' } })
```

## 4. Variables de entorno

```bash
cp .env.example .env.local
```

Completa:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (**solo servidor**)
- `ADMIN_PATH` (default `/gestion-privada`)
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`, `EMAIL_FROM`, `OWNER_EMAIL`

## 5. Seed de ejemplo

```bash
npm install
npm run seed
```

Crea 3 categorías, subcategorías y 10 productos de demostración.  
También puedes correr `supabase/seed.sql` en el SQL Editor.

## 6. Desarrollo local

```bash
npm run dev
```

- Tienda: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/gestion-privada/login](http://localhost:3000/gestion-privada/login)

## 7. Deploy en Vercel

1. Sube el repo a GitHub/GitLab.
2. Importa el proyecto en [Vercel](https://vercel.com).
3. Framework preset: **Next.js**.
4. Configura las mismas variables de `.env.example` en Project → Settings → Environment Variables.
5. Deploy.
6. Dominio personalizado: Settings → Domains → agrega tu dominio y actualiza DNS.
7. Actualiza `NEXT_PUBLIC_SITE_URL` al dominio final y, en Supabase Auth → URL Configuration, agrega la URL de producción.

## 8. Flujo de checkout

### Transferencia (completo)

1. Cliente finaliza pedido → ve datos bancarios.
2. Sube comprobante (JPG/PNG/PDF, máx 5 MB).
3. Estado `COMPROBANTE_SUBIDO` → “En espera de confirmación”.
4. Admin confirma (`confirmar_pedido` descuenta stock con `FOR UPDATE`) o rechaza con motivo.
5. Si rechazan, el cliente puede re-subir desde `/seguimiento/[codigo]`.
6. Correos al cliente y al dueño en cambios importantes.

### Link de pago (estructura lista)

- Interfaz `PaymentProvider` en `src/lib/payments/types.ts`
- Placeholder `ManualLinkProvider`
- Opción “Próximamente” en checkout; se activa con `link_pago_activo` en configuración
- Webhook: `POST /api/pagos/webhook`

### Cómo agregar un proveedor real

1. Crea `src/lib/payments/stripe-provider.ts` (o Mercado Pago) implementando `PaymentProvider`.
2. En `createPayment(pedido)` llama a la API del proveedor y guarda `payment_url` / `payment_reference`.
3. En `handleWebhook(request)` verifica la firma, identifica el pedido y llama a `confirmar_pedido`.
4. Cambia `getPaymentProvider()` en `manual-link-provider.ts`.
5. Activa `link_pago_activo` en el panel.

## 9. Seguridad

- RLS en **todas** las tablas (`002_rls.sql`)
- Pedidos: sin SELECT público; creación y seguimiento solo vía route handlers con service role
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor
- Validación Zod en APIs y server actions
- Rate limiting básico en pedidos, login y seguimiento
- Middleware protege `/gestion-privada/*` y exige admin

## 10. Scripts

```bash
npm run dev      # desarrollo
npm run build    # build producción
npm run start    # servir build
npm run seed     # datos de ejemplo
npm test         # vitest (confirmación + permisos)
```

## Estructura relevante

```
src/app/(shop)/          # sitio público
src/app/gestion-privada/ # panel admin
src/app/api/             # pedidos, seguimiento, pagos, login
src/lib/payments/        # PaymentProvider
supabase/migrations/     # schema + RLS + functions + storage
```
