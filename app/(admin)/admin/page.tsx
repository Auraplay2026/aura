import { getUsers } from "@/lib/userDb";
import ClientAdminDashboard from "./ClientAdminDashboard";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  try {
    await verifyAdminSession();
  } catch (err) {
    // Layout.tsx handles security gate if token is missing
  }

  const users = await getUsers().catch(() => []);
  
  // Aggregate regular user transactions into player feed
  const allTransactions = (users || [])
    .filter(u => u.role !== 'admin' && u.email?.toLowerCase() !== 'twintubrovquattro@gmail.com')
    .flatMap(u => 
      (u.realTransactions || []).map(tx => ({ 
        ...tx, 
        email: u.email || "", 
        username: u.username 
      }))
    ).sort((a, b) => b.timestamp - a.timestamp);

  return <ClientAdminDashboard initialUsers={users} globalTransactions={allTransactions} />;
}
