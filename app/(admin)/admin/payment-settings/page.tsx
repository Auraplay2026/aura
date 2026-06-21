import { getPaymentSettings } from "@/lib/paymentConfig";
import ClientPaymentSettingsDashboard from "./ClientPaymentSettingsDashboard";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function PaymentSettingsPage() {
  try {
    await verifyAdminSession();
  } catch (err) {
    redirect("/admin/login");
  }

  const settings = getPaymentSettings();
  return <ClientPaymentSettingsDashboard initialSettings={settings} />;
}
