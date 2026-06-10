import { getSystemConfig } from "@/lib/systemConfig";
import ClientRtpMonitorDashboard from "./ClientRtpMonitorDashboard";

export const dynamic = 'force-dynamic';

export default function RtpMonitorPage() {
  const config = getSystemConfig();
  return <ClientRtpMonitorDashboard initialSystemConfig={config} />;
}
