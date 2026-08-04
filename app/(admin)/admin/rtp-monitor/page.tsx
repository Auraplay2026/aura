import { getSystemConfig } from "@/lib/systemConfig";
import ClientRtpMonitorDashboard from "./ClientRtpMonitorDashboard";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function RtpMonitorPage() {
  try {
    await verifyAdminSession();
  } catch (err) {
    // Layout handles authentication
  }

  const config = getSystemConfig();
  return <ClientRtpMonitorDashboard initialSystemConfig={config} />;
}
