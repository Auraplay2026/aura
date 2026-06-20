import { getUsers } from "@/lib/userDb";
import ClientVipDashboard from "./ClientVipDashboard";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminVipPage() {
  try {
    await verifyAdminSession();
  } catch (err) {
    redirect("/?error=admin-auth-required");
  }

  const users = await getUsers();
  
  return <ClientVipDashboard initialUsers={users} />;
}
