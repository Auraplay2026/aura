import { getUsers } from "@/lib/userDb";
import ClientWithdrawalsDashboard from "./ClientWithdrawalsDashboard";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminWithdrawalsPage() {
  try {
    await verifyAdminSession();
  } catch (err) {
    // Layout handles authentication
  }

  const users = await getUsers().catch(() => []);
  
  // Aggregate all transactions into a single feed
  const allTransactions = (users || []).flatMap(u => 
    (u.realTransactions || []).map(tx => ({ 
      ...tx, 
      email: u.email || "", 
      username: u.username 
    }))
  ).sort((a, b) => b.timestamp - a.timestamp);

  return <ClientWithdrawalsDashboard initialUsers={users} globalTransactions={allTransactions} />;
}
