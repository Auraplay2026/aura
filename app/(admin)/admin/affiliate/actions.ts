"use server";

import { getUsers } from "@/lib/userDb";

export async function getAffiliateLeaderboardAction() {
  try {
    const users = await getUsers();
    
    // Calculate global stats
    let totalAffiliates = 0;
    let totalCommissions = 0;
    
    const promoters = users
      .filter(u => u.referralCount && u.referralCount > 0)
      .map(u => {
        totalAffiliates += 1;
        totalCommissions += (u.affiliateEarnings || 0);
        return {
          username: u.username,
          email: u.email,
          affiliateCode: u.affiliateCode || '',
          referralCount: u.referralCount || 0,
          affiliateEarnings: u.affiliateEarnings || 0
        };
      })
      .sort((a, b) => b.referralCount - a.referralCount);

    return {
      success: true,
      promoters,
      stats: {
        totalAffiliates,
        totalCommissions,
        totalSignups: promoters.reduce((acc, curr) => acc + curr.referralCount, 0)
      }
    };
  } catch (err: any) {
    console.error("Failed to fetch affiliate leaderboard", err);
    return { success: false, error: err.message };
  }
}
