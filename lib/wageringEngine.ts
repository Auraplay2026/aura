export interface WageringStageStatus {
  turnover: {
    totalDeposited: number;
    requiredTurnover: number;
    currentWagered: number;
    remainingTurnover: number;
    percent: number;
    isMet: boolean;
  };
  activity: {
    settledRounds: number;
    requiredRounds: number;
    isMet: boolean;
  };
  kyc: {
    status: string;
    isMet: boolean;
  };
  audit: {
    isClean: boolean;
  };
  isEligibleForWithdrawal: boolean;
  blockReason?: string;
}

const TURNOVER_MULTIPLIER = 3.0; // 3x Turnover Challenge
const MIN_SETTLED_ROUNDS = 10;   // Minimum 10 distinct settled game rounds / bets

export function calculateWageringStatus(user: any): WageringStageStatus {
  if (!user) {
    return {
      turnover: { totalDeposited: 0, requiredTurnover: 0, currentWagered: 0, remainingTurnover: 0, percent: 0, isMet: false },
      activity: { settledRounds: 0, requiredRounds: MIN_SETTLED_ROUNDS, isMet: false },
      kyc: { status: 'UNVERIFIED', isMet: false },
      audit: { isClean: false },
      isEligibleForWithdrawal: false,
      blockReason: 'User session not found.'
    };
  }

  // 1. Calculate Total Deposits
  const transactions = user.realTransactions || user.transactions || [];
  const totalDeposited = transactions
    .filter((t: any) => t.type === 'deposit' && (t.status === 'Completed' || t.status === 'Approved'))
    .reduce((sum: number, t: any) => sum + (parseFloat(String(t.amount)) || 0), 0);

  // 2. Calculate Total Wagered Turnover
  const rawWagered = parseFloat(String(user.totalWagered)) || 0;
  const positionsWagered = (user.realPositions || user.positions || [])
    .reduce((sum: number, p: any) => sum + (parseFloat(String(p.investment || p.amount || 0)) || 0), 0);
  
  const currentWagered = Math.max(rawWagered, positionsWagered);

  // Target turnover is 3x deposits (minimum ₹1,000 baseline)
  const requiredTurnover = totalDeposited > 0 ? totalDeposited * TURNOVER_MULTIPLIER : 1000;
  const remainingTurnover = Math.max(0, requiredTurnover - currentWagered);
  const turnoverPercent = requiredTurnover > 0 ? Math.min(100, Math.round((currentWagered / requiredTurnover) * 100)) : 100;
  const isTurnoverMet = currentWagered >= requiredTurnover;

  // 3. Activity Round Threshold
  const activityLogs = user.activityLogs || [];
  const tradeTransactions = transactions.filter((t: any) => t.type === 'trade' || t.type === 'casino' || t.type === 'cashout');
  const settledRounds = Math.max(tradeTransactions.length, activityLogs.length);
  const isActivityMet = settledRounds >= MIN_SETTLED_ROUNDS;

  // 4. KYC Status
  const kycStatus = (user.kycStatus || 'UNVERIFIED').toUpperCase();
  const isKycMet = kycStatus === 'VERIFIED' || kycStatus === 'APPROVED' || user.role === 'admin';

  // 5. Audit Check
  const isAuditClean = !user.geoRestricted;

  const isEligible = isTurnoverMet && isActivityMet && isKycMet && isAuditClean;

  let blockReason = '';
  if (!isTurnoverMet) {
    blockReason = `3x Turnover Challenge incomplete: ₹${Math.round(remainingTurnover).toLocaleString('en-IN')} remaining.`;
  } else if (!isActivityMet) {
    blockReason = `Activity requirement: ${settledRounds}/${MIN_SETTLED_ROUNDS} settled game sessions completed.`;
  } else if (!isKycMet) {
    blockReason = `KYC Identity Verification required before funds can be dispatched.`;
  } else if (!isAuditClean) {
    blockReason = `Account undergoing routine security audit. Please contact support.`;
  }

  return {
    turnover: {
      totalDeposited,
      requiredTurnover,
      currentWagered,
      remainingTurnover,
      percent: turnoverPercent,
      isMet: isTurnoverMet
    },
    activity: {
      settledRounds,
      requiredRounds: MIN_SETTLED_ROUNDS,
      isMet: isActivityMet
    },
    kyc: {
      status: kycStatus,
      isMet: isKycMet
    },
    audit: {
      isClean: isAuditClean
    },
    isEligibleForWithdrawal: isEligible,
    blockReason: isEligible ? undefined : blockReason
  };
}