import ClientAffiliateDashboard from "./ClientAffiliateDashboard";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const metadata = {
  title: 'Affiliate Analytics | BetMatrix Admin',
};

export const dynamic = 'force-dynamic';

export default async function AffiliatePage() {
  try {
    await verifyAdminSession();
  } catch (err) {
    redirect("/admin/login");
  }

  return <ClientAffiliateDashboard />;
}
