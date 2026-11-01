export type MetodoPago = "TRANSFERENCIA" | "LINK_PAGO";

export type EstadoPedido =
  | "PENDIENTE_PAGO"
  | "COMPROBANTE_SUBIDO"
  | "CONFIRMADO"
  | "RECHAZADO"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO";

export interface Categoria {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  created_at?: string;
}

export interface Subcategoria {
  id: string;
  categoria_id: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  created_at?: string;
}

export interface ProductoImagen {
  id: string;
  producto_id: string;
  url: string;
  orden: number;
  es_principal: boolean;
}

export interface Producto {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria_id: string;
  subcategoria_id: string | null;
  disponible: boolean;
  activo: boolean;
  created_at: string;
  producto_imagenes?: ProductoImagen[];
  categorias?: Categoria | null;
  subcategorias?: Subcategoria | null;
}

export interface Pedido {
  id: string;
  codigo: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  notas: string;
  total: number;
  metodo_pago: MetodoPago;
  estado: EstadoPedido;
  comprobante_path: string | null;
  motivo_rechazo: string | null;
  payment_url: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at?: string;
  pedido_items?: PedidoItem[];
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  producto_id: string | null;
  nombre_snapshot: string;
  precio_snapshot: number;
  cantidad: number;
}

export interface ConfiguracionSitio {
  id: number;
  nombre_negocio: string;
  logo_url: string | null;
  whatsapp: string;
  mensaje_whatsapp: string;
  direccion: string;
  maps_embed_url: string;
  horarios: string;
  datos_bancarios: string;
  link_pago_activo: boolean;
  updated_at?: string;
}

export const ESTADO_LABELS: Record<EstadoPedido, string> = {
  PENDIENTE_PAGO: "Pendiente de pago",
  COMPROBANTE_SUBIDO: "Comprobante subido",
  CONFIRMADO: "Confirmado",
  RECHAZADO: "Rechazado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};
