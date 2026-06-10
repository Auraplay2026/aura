import { getPaymentSettings } from "@/lib/paymentConfig";
import ClientPaymentSettingsDashboard from "./ClientPaymentSettingsDashboard";

export const dynamic = 'force-dynamic';

export default function PaymentSettingsPage() {
  const settings = getPaymentSettings();
  return <ClientPaymentSettingsDashboard initialSettings={settings} />;
}
