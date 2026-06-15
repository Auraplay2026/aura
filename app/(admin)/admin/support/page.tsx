import { getChatSessions, getSupportConfig } from "@/lib/supportDb";
import ClientSupportDashboard from "./ClientSupportDashboard";

export const dynamic = 'force-dynamic';

export default async function SupportDashboardPage() {
  const sessions = await getChatSessions();
  const config = await getSupportConfig();

  return (
    <ClientSupportDashboard 
      initialSessions={sessions} 
      initialConfig={config} 
    />
  );
}
