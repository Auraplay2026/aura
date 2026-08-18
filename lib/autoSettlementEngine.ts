import { prisma } from './prisma';
import { updateUser, Transaction } from './userDb';
import { calculatePayoutPaise, computeIdempotencyHash, writeAuditLogEntry } from './settlementEngine';
import { getSportMatchesWithSWR } from './sportsCache';
import { CREX_MATCHES_DATABASE } from './sportsDeepData';

function isFuzzyMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const cleanA = a.toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanB = b.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleanA.includes(cleanB) || cleanB.includes(cleanA);
}

export interface AutoSettlementResult {
  totalAudited: number;
  settledWon: number;
  settledLost: number;
  settledVoid: number;
  totalPayouts: number;
  errors: string[];
}

/**
 * Universal Automated Sports Settlement & Reconciliation Engine
 * Continuously evaluates all open positions and locked transactions,
 * matches them against real-world concluded match outcomes, and releases
 * funds with full paise precision and cryptographic audit logs.
 */
export async function runAutoSettlementCycle(): Promise<AutoSettlementResult> {
  const result: AutoSettlementResult = {
    totalAudited: 0,
    settledWon: 0,
    settledLost: 0,
    settledVoid: 0,
    totalPayouts: 0,
    errors: []
  };

  try {
    // 1. Fetch all open positions across all users
    const openPositions = await prisma.position.findMany({
      include: {
        user: {
          include: { transactions: true }
        }
      }
    });

    result.totalAudited = openPositions.length;
    if (openPositions.length === 0) {
      return result;
    }

    // 2. Fetch fresh live and concluded match listings
    let liveMatches: any[] = [];
    try {
      const swrFeed = await getSportMatchesWithSWR("all");
      liveMatches = swrFeed.matches || [];
    } catch (e) {
      console.warn("Failed to fetch live matches feed for settlement cycle:", e);
    }

    const now = Date.now();
    const FORCE_MAJEURE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 Hours timeout for concluded/abandoned matches

    for (const pos of openPositions) {
      try {
        const user = pos.user;
        if (!user) continue;

        // Parse position and bet parameters
        const marketTitle = pos.marketTitle || "";
        const side = (pos.side || "yes").toLowerCase(); // 'yes' = Back, 'no' = Lay
        const isLay = side === "no";
        const odds = pos.buyPrice || 2.0;
        const totalInvestment = pos.investment || pos.shares || 100;
        const betAgeMs = now - pos.timestamp;

        // Extract match title and selection from position marketTitle:
        // Format: "[LOCKED] Match Title: Selection (Odds)" or "Match Title"
        let matchTitle = "";
        let selection = "";
        
        const cleanTitle = marketTitle.replace(/^\[LOCKED\]\s*/i, "").trim();
        const colonIdx = cleanTitle.indexOf(":");
        if (colonIdx !== -1) {
          matchTitle = cleanTitle.substring(0, colonIdx).trim();
          const selPart = cleanTitle.substring(colonIdx + 1).trim();
          selection = selPart.replace(/\s*\([\d.]+\)$/, "").trim();
        } else {
          matchTitle = cleanTitle;
          selection = cleanTitle;
        }

        // Match against live matches or CREX database
        let resolvedOutcome: "Won" | "Lost" | "Void" | null = null;
        let outcomeReason = "";

        // Check CREX verified matches database
        for (const [key, crexMatch] of Object.entries(CREX_MATCHES_DATABASE)) {
          const t1 = crexMatch.team1?.name || "";
          const t2 = crexMatch.team2?.name || "";
          const crexTitle = `${t1} vs ${t2}`;
          
          if (
            isFuzzyMatch(matchTitle, crexTitle) ||
            (isFuzzyMatch(matchTitle, t1) && isFuzzyMatch(matchTitle, t2))
          ) {
            const statusStr = (crexMatch.status || "").toLowerCase();
            const isFinished = statusStr.includes("won by") || statusStr.includes("complete") || statusStr.includes("finish");
            
            if (isFinished) {
              // Determine winner
              let winnerTeam = "";
              if (statusStr.includes(t1.toLowerCase()) && statusStr.includes("won")) {
                winnerTeam = t1;
              } else if (statusStr.includes(t2.toLowerCase()) && statusStr.includes("won")) {
                winnerTeam = t2;
              }

              if (winnerTeam) {
                const isSelectionWinner = isFuzzyMatch(selection, winnerTeam);
                if (isLay) {
                  resolvedOutcome = isSelectionWinner ? "Lost" : "Won";
                } else {
                  resolvedOutcome = isSelectionWinner ? "Won" : "Lost";
                }
                outcomeReason = `Match concluded: ${crexMatch.status}`;
                break;
              } else if (statusStr.includes("tied") || statusStr.includes("no result") || statusStr.includes("abandon")) {
                resolvedOutcome = "Void";
                outcomeReason = `Match abandoned / no result: ${crexMatch.status}`;
                break;
              }
            }
          }
        }

        // Check SWR feed matches
        if (!resolvedOutcome && liveMatches.length > 0) {
          for (const lm of liveMatches) {
            const t1 = lm.team1 || "";
            const t2 = lm.team2 || "";
            const lmTitle = `${t1} v ${t2}`;

            if (
              isFuzzyMatch(matchTitle, lmTitle) ||
              (isFuzzyMatch(matchTitle, t1) && isFuzzyMatch(matchTitle, t2))
            ) {
              const scoreStr = (lm.score || "").toLowerCase();
              const isCompleted = scoreStr.includes("won by") || scoreStr.includes("complete") || lm.status === "Completed";

              if (isCompleted) {
                let winnerTeam = "";
                if (scoreStr.includes(t1.toLowerCase()) && scoreStr.includes("won")) {
                  winnerTeam = t1;
                } else if (scoreStr.includes(t2.toLowerCase()) && scoreStr.includes("won")) {
                  winnerTeam = t2;
                }

                if (winnerTeam) {
                  const isSelectionWinner = isFuzzyMatch(selection, winnerTeam);
                  resolvedOutcome = isLay ? (isSelectionWinner ? "Lost" : "Won") : (isSelectionWinner ? "Won" : "Lost");
                  outcomeReason = `Concluded via feed: ${lm.score}`;
                  break;
                } else if (scoreStr.includes("abandon") || scoreStr.includes("no result") || scoreStr.includes("void")) {
                  resolvedOutcome = "Void";
                  outcomeReason = `Match voided via feed: ${lm.score}`;
                  break;
                }
              }
            }
          }
        }

        // 3. Force Majeure / Bet Age Timeout (Older than 24 hours without resolution)
        // Never allow open user funds to linger indefinitely!
        if (!resolvedOutcome && betAgeMs >= FORCE_MAJEURE_TIMEOUT_MS) {
          resolvedOutcome = "Void";
          outcomeReason = `Auto-reconciled: Match exceeded 24hr settlement window (${Math.round(betAgeMs / 3600000)}h elapsed). Full stake & liability refunded to user.`;
        }

        // If outcome is determined, execute double-entry settlement!
        if (resolvedOutcome) {
          const settlementStatus = resolvedOutcome;
          
          // Locate corresponding user transaction
          const lockedTx = (user.transactions || []).find((t: any) => 
            (t.status === "Locked" || t.status === "Pending") &&
            (t.id === pos.id || (t.details && t.details.includes(selection)))
          );

          // Calculate payout
          let payout = 0;
          if (settlementStatus === "Won") {
            // Back: Stake * Odds | Lay: Stake + Liability (i.e. total investment without fee)
            payout = isLay ? totalInvestment : Math.round((pos.shares || (totalInvestment * odds)) * 100) / 100;
          } else if (settlementStatus === "Void") {
            payout = totalInvestment; // 100% full refund
          } else {
            payout = 0;
          }

          // Execute Prisma transaction
          await prisma.$transaction(async (txClient) => {
            const accountType = pos.walletType === "real" ? "real" : "demo";
            const currentBalance = accountType === "real" ? user.realBalance : user.demoBalance;
            const newBalance = Math.round((currentBalance + payout) * 100) / 100;

            const txUpdates: any = {
              balance: newBalance
            };

            const updatedTransactions: any[] = [];

            if (lockedTx) {
              const updatedTx: any = {
                id: lockedTx.id,
                type: 'trade',
                amount: lockedTx.amount,
                balanceAfter: newBalance,
                timestamp: lockedTx.timestamp,
                details: `${lockedTx.details} · Settled: ${settlementStatus} (${outcomeReason})`,
                status: settlementStatus === "Void" ? "Failed" : settlementStatus
              };
              if (lockedTx.upiId) updatedTx.upiId = lockedTx.upiId;
              if (lockedTx.utr) updatedTx.utr = lockedTx.utr;
              if (lockedTx.screenshotUrl) updatedTx.screenshotUrl = lockedTx.screenshotUrl;
              updatedTransactions.push(updatedTx);
            }

            // Record separate payout / refund deposit transaction if payout > 0
            if (payout > 0) {
              const payoutTxId = `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              const payoutTx: Transaction = {
                id: payoutTxId,
                type: 'deposit',
                amount: payout,
                balanceAfter: newBalance,
                timestamp: Date.now(),
                details: settlementStatus === "Void"
                  ? `Refund: ${outcomeReason}`
                  : `Winnings Payout: ${selection} @ ${odds.toFixed(2)} (${matchTitle})`,
                status: 'Completed'
              };
              updatedTransactions.push(payoutTx);
            }

            if (accountType === "real") {
              txUpdates.realBalance = newBalance;
              txUpdates.realTransactions = updatedTransactions;
            } else {
              txUpdates.demoBalance = newBalance;
              txUpdates.demoTransactions = updatedTransactions;
            }

            // Remove Position record
            await txClient.position.delete({
              where: { id: pos.id }
            });

            // Insert real-time notification
            await txClient.notification.create({
              data: {
                userId: user.id,
                message: settlementStatus === "Won"
                  ? `🏆 Sports Bet Settled! Your bet on ${selection} @ ${odds.toFixed(2)} won ₹${payout.toLocaleString()}. Funds credited.`
                  : settlementStatus === "Void"
                    ? `🔄 Match Refunded: Your ₹${totalInvestment.toLocaleString()} wager on ${matchTitle} has been fully refunded.`
                    : `📊 Sports Bet Settled: Your bet on ${selection} (${matchTitle}) concluded as ${settlementStatus}.`,
                timestamp: Date.now(),
                read: false
              }
            });

            await updateUser(user.email || user.username, txUpdates, txClient);

            // Write cryptographic audit log
            const eventData = {
              marketId: pos.marketId,
              marketName: matchTitle,
              selectionName: selection,
              stake: totalInvestment,
              odds: odds,
              outcome: settlementStatus,
              userId: user.email || user.username,
              transactionId: lockedTx?.id || pos.id,
              roundId: `ROUND-${pos.id}`,
              timestamp: Date.now()
            };
            const idHash = computeIdempotencyHash(eventData.transactionId, eventData.roundId);
            writeAuditLogEntry(eventData, idHash);
          });

          if (settlementStatus === "Won") result.settledWon++;
          else if (settlementStatus === "Lost") result.settledLost++;
          else if (settlementStatus === "Void") result.settledVoid++;
          result.totalPayouts += payout;
        }
      } catch (itemErr: any) {
        result.errors.push(`Error settling position ${pos.id}: ${itemErr?.message || itemErr}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Auto-settlement cycle error: ${err?.message || err}`);
  }

  return result;
}