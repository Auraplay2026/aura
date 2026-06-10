import { getChatSessions, getSupportConfig } from "@/lib/supportDb";
import ClientSupportDashboard from "./ClientSupportDashboard";

export const dynamic = 'force-dynamic';

export default function SupportDashboardPage() {
  const sessions = getChatSessions();
  const config = getSupportConfig();

  return (
    <ClientSupportDashboard 
      initialSessions={sessions} 
      initialConfig={config} 
    />
  );
}
