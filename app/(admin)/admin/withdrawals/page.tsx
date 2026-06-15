import { getUsers } from "@/lib/userDb";
import ClientWithdrawalsDashboard from "./ClientWithdrawalsDashboard";

export const dynamic = 'force-dynamic';

export default async function AdminWithdrawalsPage() {
  const users = await getUsers();
  
  // Aggregate all transactions into a single feed
  const allTransactions = users.flatMap(u => 
    u.realTransactions.map(tx => ({ 
      ...tx, 
      email: u.email, 
      username: u.username 
    }))
  ).sort((a, b) => b.timestamp - a.timestamp);

  return <ClientWithdrawalsDashboard initialUsers={users} globalTransactions={allTransactions} />;
}
