import { Resend } from "resend";
import type { Pedido, EstadoPedido } from "@/types/database";
import { ESTADO_LABELS, formatPrice } from "@/lib/format";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  return process.env.EMAIL_FROM || "Catálogo <onboarding@resend.dev>";
}

function ownerEmail() {
  return process.env.OWNER_EMAIL || "";
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY no configurada — correo omitido:", opts.subject);
    return { skipped: true };
  }

  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    console.error("[email] Error:", error);
    return { error };
  }
  return { ok: true };
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function notifyPedidoCreado(pedido: Pedido) {
  const seguimiento = `${baseUrl()}/seguimiento/${pedido.codigo}`;
  const clienteHtml = `
    <h2>Pedido recibido: ${pedido.codigo}</h2>
    <p>Hola ${pedido.nombre}, recibimos tu pedido por ${formatPrice(pedido.total)}.</p>
    <p>Estado: <strong>${ESTADO_LABELS[pedido.estado]}</strong></p>
    <p>Puedes dar seguimiento aquí: <a href="${seguimiento}">${seguimiento}</a></p>
  `;
  const dueñoHtml = `
    <h2>Nuevo pedido ${pedido.codigo}</h2>
    <p>Cliente: ${pedido.nombre} (${pedido.correo} / ${pedido.telefono})</p>
    <p>Total: ${formatPrice(pedido.total)} · Método: ${pedido.metodo_pago}</p>
    <p>Estado: ${ESTADO_LABELS[pedido.estado]}</p>
  `;

  await Promise.all([
    sendEmail({
      to: pedido.correo,
      subject: `Pedido ${pedido.codigo} recibido`,
      html: clienteHtml,
    }),
    ownerEmail()
      ? sendEmail({
          to: ownerEmail(),
          subject: `Nuevo pedido ${pedido.codigo}`,
          html: dueñoHtml,
        })
      : Promise.resolve(),
  ]);
}

export async function notifyCambioEstado(
  pedido: Pedido,
  estadoAnterior: EstadoPedido
) {
  const seguimiento = `${baseUrl()}/seguimiento/${pedido.codigo}`;
  const motivo =
    pedido.estado === "RECHAZADO" && pedido.motivo_rechazo
      ? `<p>Motivo: ${pedido.motivo_rechazo}</p>`
      : "";

  await Promise.all([
    sendEmail({
      to: pedido.correo,
      subject: `Pedido ${pedido.codigo}: ${ESTADO_LABELS[pedido.estado]}`,
      html: `
        <h2>Actualización de pedido ${pedido.codigo}</h2>
        <p>Tu pedido pasó de <em>${ESTADO_LABELS[estadoAnterior]}</em> a
        <strong>${ESTADO_LABELS[pedido.estado]}</strong>.</p>
        ${motivo}
        <p><a href="${seguimiento}">Ver seguimiento</a></p>
      `,
    }),
    ownerEmail()
      ? sendEmail({
          to: ownerEmail(),
          subject: `Pedido ${pedido.codigo} → ${ESTADO_LABELS[pedido.estado]}`,
          html: `<p>El pedido ${pedido.codigo} cambió a ${ESTADO_LABELS[pedido.estado]}.</p>${motivo}`,
        })
      : Promise.resolve(),
  ]);
}
