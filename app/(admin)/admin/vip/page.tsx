import { getUsers } from "@/lib/userDb";
import ClientVipDashboard from "./ClientVipDashboard";

export const dynamic = 'force-dynamic';

export default async function AdminVipPage() {
  const users = await getUsers();
  
  return <ClientVipDashboard initialUsers={users} />;
}
