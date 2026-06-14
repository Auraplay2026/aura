import { getUsers } from "@/lib/userDb";
import ClientVipDashboard from "./ClientVipDashboard";

export const dynamic = 'force-dynamic';

export default function VipPage() {
  const users = getUsers();
  
  return <ClientVipDashboard initialUsers={users} />;
}
