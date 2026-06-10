import { getUsers } from "@/lib/userDb";
import ClientDepositsDashboard from "./ClientDepositsDashboard";

export const dynamic = 'force-dynamic';

export default function DepositsPage() {
  const users = getUsers();
  
  // Aggregate all transactions into a single feed
  const allTransactions = users.flatMap(u => 
    u.realTransactions.map(tx => ({ 
      ...tx, 
      email: u.email, 
      username: u.username 
    }))
  ).sort((a, b) => b.timestamp - a.timestamp);

  return <ClientDepositsDashboard initialUsers={users} globalTransactions={allTransactions} />;
}
