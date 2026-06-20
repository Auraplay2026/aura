import { getUsers } from "@/lib/userDb";
import { gameHistory } from "@/lib/gameHistory";
import { getNotificationLogsAction } from "../actions";
import ClientUserAnalytics from "./ClientUserAnalytics";
import { verifyAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  try {
    await verifyAdminSession();
  } catch (err) {
    redirect("/?error=admin-auth-required");
  }

  const resolvedSearchParams = await searchParams;
  const selectedEmail = resolvedSearchParams.email || "";

  // Make sure users list triggers initial seed if empty
  const users = await getUsers();
  const allRounds = gameHistory.getAllRounds();
  const notificationLogs = await getNotificationLogsAction();

  return (
    <ClientUserAnalytics
      users={users}
      allRounds={allRounds}
      notificationLogs={notificationLogs}
      initialSelectedEmail={selectedEmail}
    />
  );
}
