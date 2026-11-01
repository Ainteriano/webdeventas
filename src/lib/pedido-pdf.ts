import { jsPDF } from "jspdf";
import { formatPrice } from "@/lib/format";

export type PedidoPdfItem = {
  nombre: string;
  precio: number;
  cantidad: number;
};

export type PedidoPdfData = {
  id?: string;
  codigo: string;
  nombre: string;
  telefono: string;
  correo: string;
  direccion: string;
  notas?: string;
  banco: string;
  total: number;
  metodo_pago: string;
  created_at: string;
  items: PedidoPdfItem[];
  comercio: {
    nombre_negocio: string;
    direccion: string;
    whatsapp: string;
    horarios: string;
  };
};

export function descargarPedidoPdf(data: PedidoPdfData) {
  const doc = new jsPDF();
  const margen = 18;
  let y = 20;

  const fecha = new Intl.DateTimeFormat("es-HN", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(data.created_at));

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.comercio.nombre_negocio || "American Shoes", margen, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Outlet Shoes San Pedro Sula", margen, y);
  y += 6;
  if (data.comercio.direccion) {
    const lines = doc.splitTextToSize(data.comercio.direccion, 170);
    doc.text(lines, margen, y);
    y += lines.length * 5 + 2;
  }
  if (data.comercio.whatsapp) {
    doc.text(`WhatsApp: ${data.comercio.whatsapp}`, margen, y);
    y += 5;
  }
  if (data.comercio.horarios) {
    doc.text(`Horarios: ${data.comercio.horarios}`, margen, y);
    y += 5;
  }

  y += 4;
  doc.setDrawColor(180);
  doc.line(margen, y, 192, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Comprobante de pedido", margen, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(`Seguimiento: ${data.codigo}`, margen, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, margen, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Datos del cliente", margen, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  const cliente = [
    `Nombre: ${data.nombre}`,
    `Teléfono: ${data.telefono}`,
    `Correo: ${data.correo}`,
    `Dirección: ${data.direccion}`,
    `Banco de transferencia: ${data.banco}`,
    `Método de pago: ${data.metodo_pago}`,
  ];
  if (data.notas) cliente.push(`Notas: ${data.notas}`);
  for (const line of cliente) {
    const wrapped = doc.splitTextToSize(line, 170);
    doc.text(wrapped, margen, y);
    y += wrapped.length * 5 + 1;
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Artículos", margen, y);
  y += 7;
  doc.setFont("helvetica", "normal");

  for (const item of data.items) {
    const linea = `${item.nombre}  × ${item.cantidad}   ${formatPrice(
      item.precio * item.cantidad
    )}`;
    const wrapped = doc.splitTextToSize(linea, 170);
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(wrapped, margen, y);
    y += wrapped.length * 5 + 2;
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total: ${formatPrice(data.total)}`, margen, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    "Pedido en espera de confirmación. Conserva este PDF y tu código de seguimiento.",
    margen,
    y
  );

  doc.save(`pedido-${data.codigo}.pdf`);
}
