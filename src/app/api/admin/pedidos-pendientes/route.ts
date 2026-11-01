import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

/** Lista IDs de pedidos con comprobante pendiente de confirmación. */
export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("id")
    .eq("estado", "COMPROBANTE_SUBIDO")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ids: (data || []).map((r: { id: string }) => r.id),
  });
}
