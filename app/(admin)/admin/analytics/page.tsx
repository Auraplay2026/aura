import { getUsers } from "@/lib/userDb";
import { gameHistory } from "@/lib/gameHistory";
import { getNotificationLogsAction } from "../actions";
import ClientUserAnalytics from "./ClientUserAnalytics";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedEmail = resolvedSearchParams.email || "";

  // Make sure users list triggers initial seed if empty
  const users = getUsers();
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
