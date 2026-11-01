"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin, getAdminPath } from "@/lib/admin";
import {
  actualizarEstadoSchema,
  rechazarPedidoSchema,
} from "@/lib/validations";
import { notifyCambioEstado } from "@/lib/email";
import type { EstadoPedido, Pedido } from "@/types/database";

async function assertAdmin() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) throw new Error("No autorizado");
}

function revalidatePedidos(pedidoId?: string) {
  const base = getAdminPath();
  revalidatePath(`${base}/pedidos`);
  if (pedidoId) revalidatePath(`${base}/pedidos/${pedidoId}`);
  revalidatePath(base);
  revalidatePath("/");
  revalidatePath("/catalogo");
}

export async function confirmarPedidoAction(pedidoId: string) {
  await assertAdmin();
  const admin = createAdminClient();

  const { data: before } = await admin
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .single();

  const { data, error } = await admin.rpc("confirmar_pedido", {
    p_pedido_id: pedidoId,
  });

  if (error) return { error: error.message };

  if (before && data) {
    void notifyCambioEstado(
      { ...(data as Pedido), total: Number((data as Pedido).total) },
      before.estado as EstadoPedido
    );
  }

  revalidatePedidos(pedidoId);
  return { ok: true, pedido: data };
}

export async function rechazarPedidoAction(input: unknown) {
  await assertAdmin();
  const parsed = rechazarPedidoSchema.safeParse(input);
  if (!parsed.success) return { error: "Motivo inválido" };

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("pedidos")
    .select("*")
    .eq("id", parsed.data.pedido_id)
    .single();

  const { data, error } = await admin.rpc("rechazar_pedido", {
    p_pedido_id: parsed.data.pedido_id,
    p_motivo: parsed.data.motivo,
  });

  if (error) return { error: error.message };

  if (before && data) {
    void notifyCambioEstado(
      { ...(data as Pedido), total: Number((data as Pedido).total) },
      before.estado as EstadoPedido
    );
  }

  revalidatePedidos(parsed.data.pedido_id);
  return { ok: true };
}

export async function actualizarEstadoPedidoAction(input: unknown) {
  await assertAdmin();
  const parsed = actualizarEstadoSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };

  if (parsed.data.estado === "RECHAZADO") {
    return rechazarPedidoAction({
      pedido_id: parsed.data.pedido_id,
      motivo: parsed.data.motivo || "Rechazado",
    });
  }

  if (parsed.data.estado === "CONFIRMADO") {
    return confirmarPedidoAction(parsed.data.pedido_id);
  }

  const admin = createAdminClient();
  const { data: before } = await admin
    .from("pedidos")
    .select("*")
    .eq("id", parsed.data.pedido_id)
    .single();

  const { data, error } = await admin.rpc("actualizar_estado_pedido", {
    p_pedido_id: parsed.data.pedido_id,
    p_estado: parsed.data.estado,
  });

  if (error) return { error: error.message };

  if (parsed.data.estado === "CANCELADO" && parsed.data.motivo) {
    await admin
      .from("pedidos")
      .update({ motivo_rechazo: parsed.data.motivo })
      .eq("id", parsed.data.pedido_id);
  }

  if (before && data) {
    void notifyCambioEstado(
      { ...(data as Pedido), total: Number((data as Pedido).total) },
      before.estado as EstadoPedido
    );
  }

  revalidatePedidos(parsed.data.pedido_id);
  return { ok: true };
}

export async function getComprobanteSignedUrl(pedidoId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { data: pedido } = await admin
    .from("pedidos")
    .select("comprobante_path")
    .eq("id", pedidoId)
    .maybeSingle();

  if (!pedido?.comprobante_path) return { error: "Sin comprobante" };

  const { data, error } = await admin.storage
    .from("comprobantes")
    .createSignedUrl(pedido.comprobante_path, 60 * 10);

  if (error || !data) {
    return { error: error?.message || "No se pudo firmar URL" };
  }
  return { ok: true, url: data.signedUrl };
}
