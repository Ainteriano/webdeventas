import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const categoriaSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(100),
  slug: z.string().min(1).max(120).optional(),
  orden: z.coerce.number().int().min(0).default(0),
  activa: z.boolean().default(true),
});

export const subcategoriaSchema = z.object({
  categoria_id: z.string().uuid("Categoría inválida"),
  nombre: z.string().min(1, "Nombre requerido").max(100),
  slug: z.string().min(1).max(120).optional(),
  orden: z.coerce.number().int().min(0).default(0),
  activa: z.boolean().default(true),
});

export const productoSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido").max(200),
  slug: z.string().min(1).max(220).optional(),
  descripcion: z.string().max(5000).default(""),
  precio: z.coerce.number().min(0, "Precio inválido"),
  stock: z.coerce.number().int().min(0, "Stock inválido"),
  categoria_id: z.string().uuid("Categoría inválida"),
  subcategoria_id: z.string().uuid().nullable().optional(),
  disponible: z.boolean().default(true),
  activo: z.boolean().default(true),
});

export const productoRapidoSchema = z.object({
  id: z.string().uuid(),
  precio: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
});

export const moverProductosSchema = z.object({
  producto_ids: z.array(z.string().uuid()).min(1),
  categoria_id: z.string().uuid(),
  subcategoria_id: z.string().uuid().nullable().optional(),
});

export const checkoutItemSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.coerce.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido").max(120),
  telefono: z
    .string()
    .min(8, "Teléfono inválido")
    .max(20)
    .regex(/^[\d+\s()-]+$/, "Teléfono inválido"),
  correo: z.string().email("Correo inválido"),
  direccion: z.string().max(500).optional().default(""),
  notas: z.string().max(1000).optional().default(""),
  banco: z
    .string()
    .min(2, "Indica el banco de origen del depósito")
    .max(120),
  metodo_pago: z.enum(["TRANSFERENCIA", "LINK_PAGO"]),
  items: z.array(checkoutItemSchema).min(1, "El carrito está vacío"),
});

export const rechazarPedidoSchema = z.object({
  pedido_id: z.string().uuid(),
  motivo: z.string().min(3, "Motivo requerido").max(500),
});

export const actualizarEstadoSchema = z.object({
  pedido_id: z.string().uuid(),
  estado: z.enum([
    "CONFIRMADO",
    "ENVIADO",
    "ENTREGADO",
    "CANCELADO",
    "RECHAZADO",
  ]),
  motivo: z.string().max(500).optional(),
});

export const configuracionSchema = z.object({
  nombre_negocio: z.string().min(1).max(120),
  logo_url: z.string().url().nullable().optional().or(z.literal("")),
  whatsapp: z.string().min(8).max(20),
  mensaje_whatsapp: z.string().max(500),
  direccion: z.string().max(500),
  maps_embed_url: z.string().max(2000),
  horarios: z.string().max(500),
  datos_bancarios: z.string().max(2000),
  link_pago_activo: z.boolean(),
});

export const seguimientoSchema = z.object({
  codigo: z
    .string()
    .min(5)
    .max(20)
    .regex(/^PED-[A-Z0-9]+$/i, "Código inválido"),
});

export const COMPROBANTE_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
] as const;

export const MAX_COMPROBANTE_BYTES = 5 * 1024 * 1024;
