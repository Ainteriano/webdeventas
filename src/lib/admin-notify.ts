import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Avisa al panel admin (broadcast Realtime) cuando hay un pedido listo.
 * No bloquea la compra si falla.
 */
export async function notifyAdminNuevoPedido(payload: {
  id: string;
  codigo?: string;
}) {
  try {
    const admin = createAdminClient();
    const channel = admin.channel("admin-order-alerts");

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => {
        reject(new Error("timeout broadcast"));
      }, 4000);

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(t);
          resolve();
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          clearTimeout(t);
          reject(new Error(status));
        }
      });
    });

    await channel.send({
      type: "broadcast",
      event: "nuevo-pedido",
      payload,
    });

    await admin.removeChannel(channel);
  } catch (err) {
    console.warn("[notifyAdminNuevoPedido]", err);
  }
}
