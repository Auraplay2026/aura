import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { gameHistory } from '@/lib/gameHistory';
import { GAMES } from '@/lib/games';
import { getUsers } from '@/lib/userDb';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'hype_bets.json');
    let simulatedBets: any[] = [];
    let baseTotalWagered = 14800000; // ₹14.8M baseline
    let baseMaxWin = 850000; // ₹850k baseline
    let baseActivePlayers = 842;

    if (fs.existsSync(filePath)) {
      try {
        const fileData = fs.readFileSync(filePath, 'utf-8');
        const payload = JSON.parse(fileData);
        simulatedBets = payload.bets || [];
        
        // Parse baseline statistics from file
        if (payload.stats) {
          const matchWagered = payload.stats.totalWagered?.match(/₹([\d.]+)M/);
          if (matchWagered) baseTotalWagered = parseFloat(matchWagered[1]) * 1000000;
          
          const matchMaxWin = payload.stats.maxWin?.match(/₹([\d.]+)M/);
          const matchMaxWinK = payload.stats.maxWin?.match(/₹([\d.]+)K/);
          if (matchMaxWin) baseMaxWin = parseFloat(matchMaxWin[1]) * 1000000;
          else if (matchMaxWinK) baseMaxWin = parseFloat(matchMaxWinK[1]) * 1000;
          
          const matchActive = payload.stats.activePlayers?.replace(/,/g, '');
          if (matchActive) baseActivePlayers = parseInt(matchActive);
        }
      } catch (e) {
        console.error("Error reading simulated wagers payload:", e);
      }
    }

    // Load real transactions and casino wagers from gameHistory singleton
    const realRounds = gameHistory.getAllRounds() || [];
    
    // Sort real rounds by timestamp descending (newest first)
    const sortedRounds = [...realRounds].sort((a, b) => b.timestamp - a.timestamp);

    // Map real rounds into the live activity feed format
    const realBetsMapped = sortedRounds.map(round => {
      const game = GAMES.find(g => g.id === round.gameId);
      const gameTitle = game ? game.title : (round.gameId.charAt(0).toUpperCase() + round.gameId.slice(1));
      
      const isRental = game 
        ? game.categories.some(cat => ["fps", "driving", "retro", "sports", "action", "puzzle", "racing", "adventure"].includes(cat)) 
        : false;

      const username = round.userId.includes('@') 
        ? round.userId.split('@')[0] 
        : round.userId;
      
      // Mask username slightly for privacy (e.g. Pri** vs Priya)
      const maskedName = username.length > 3 
        ? `${username.substring(0, 3)}**` 
        : username;

      let color = "text-slate-500";
      if (isRental) {
        const duration = round.multiplier || 1; 
        const hourly_rate = round.wager / duration;
        if (duration > 6) color = "text-neon-purple animate-pulse";
        else if (duration > 3) color = "text-amber-600";
        else color = "text-emerald-600";

        return {
          user: maskedName,
          bet: `${duration} hrs`,
          mult: `₹${hourly_rate.toLocaleString('en-IN')}/hr`,
          win: `₹${round.wager.toLocaleString('en-IN')}`,
          raw_bet: hourly_rate,
          raw_payout: round.wager,
          raw_mult: duration,
          game: gameTitle,
          color,
          type: "rental",
          isReal: true,
          timestamp: round.timestamp
        };
      } else {
        const multiplier = round.multiplier;
        if (multiplier > 10.0) color = "text-neon-purple animate-pulse";
        else if (multiplier > 3.0) color = "text-amber-600";
        else if (multiplier > 0.0) color = "text-emerald-600";

        return {
          user: maskedName,
          bet: `₹${round.wager.toLocaleString('en-IN')}`,
          mult: `${multiplier.toFixed(2)}x`,
          win: `₹${round.payout.toLocaleString('en-IN')}`,
          raw_bet: round.wager,
          raw_payout: round.payout,
          raw_mult: multiplier,
          game: gameTitle,
          color,
          type: "bet",
          isReal: true,
          timestamp: round.timestamp
        };
      }
    });

    // Merge real and simulated bets, sorting so the newest real bets are strictly at the top
    const combinedBets = [...realBetsMapped, ...simulatedBets].slice(0, 25);

    // Compute live real statistics to sum with base counters
    const totalRealWagered = realRounds.reduce((sum, r) => sum + r.wager, 0);
    const maxRealWin = realRounds.reduce((max, r) => r.payout > max ? r.payout : max, 0);
    
    const totalWageredSum = baseTotalWagered + totalRealWagered;
    const maxWinVal = Math.max(baseMaxWin, maxRealWin);
    
    // Count distinct actual registered users to add to player count
    const registeredUsersCount = getUsers().length;
    const activePlayersSum = baseActivePlayers + registeredUsersCount;

    return NextResponse.json({
      success: true,
      bets: combinedBets,
      stats: {
        totalWagered: `₹${(totalWageredSum / 1000000).toFixed(3)}M`,
        maxWin: maxWinVal >= 1000000 
          ? `₹${(maxWinVal / 1000000).toFixed(2)}M` 
          : `₹${(maxWinVal / 1000).toFixed(0)}K`,
        activePlayers: activePlayersSum.toLocaleString('en-IN')
      }
    }, { status: 200 });

  } catch (err: any) {
    console.error("Failed to load live wagers feed:", err);
    return NextResponse.json({ error: 'Failed to retrieve live wagers.' }, { status: 500 });
  }
}
