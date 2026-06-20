import { getChatSessions, getSupportConfig } from "@/lib/supportDb";
import ClientSupportDashboard from "./ClientSupportDashboard";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SupportDashboardPage() {
  try {
    await verifyAdminSession();
  } catch (err) {
    redirect("/?error=admin-auth-required");
  }

  const sessions = await getChatSessions();
  const config = await getSupportConfig();

  return (
    <ClientSupportDashboard 
      initialSessions={sessions} 
      initialConfig={config} 
    />
  );
}
