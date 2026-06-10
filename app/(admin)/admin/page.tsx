import { getUsers } from "@/lib/userDb";
import ClientAdminDashboard from "./ClientAdminDashboard";

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const users = getUsers();
  
  // Aggregate all transactions into a single feed
  const allTransactions = users.flatMap(u => 
    u.realTransactions.map(tx => ({ 
      ...tx, 
      email: u.email, 
      username: u.username 
    }))
  ).sort((a, b) => b.timestamp - a.timestamp);

  return <ClientAdminDashboard initialUsers={users} globalTransactions={allTransactions} />;
}
