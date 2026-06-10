import { getWhatsAppConfig } from "@/lib/notificationService";
import ClientWhatsAppSettingsDashboard from "./ClientWhatsAppSettingsDashboard";

export const dynamic = 'force-dynamic';

export default function WhatsAppSettingsPage() {
  const config = getWhatsAppConfig();
  return <ClientWhatsAppSettingsDashboard initialConfig={config} />;
}
