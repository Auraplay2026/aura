import { getWhatsAppConfig } from "@/lib/notificationService";
import ClientWhatsAppSettingsDashboard from "./ClientWhatsAppSettingsDashboard";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function WhatsAppSettingsPage() {
  try {
    await verifyAdminSession();
  } catch (err) {
    redirect("/?error=admin-auth-required");
  }

  const config = getWhatsAppConfig();
  return <ClientWhatsAppSettingsDashboard initialConfig={config} />;
}
