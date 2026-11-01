import { redirect } from "next/navigation";
import { getAdminPath, requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { OrderAlerts } from "@/components/admin/order-alerts";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminPath = getAdminPath();
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    redirect(`${adminPath}/login`);
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminNav adminPath={adminPath} />
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      <OrderAlerts adminPath={adminPath} />
    </div>
  );
}
