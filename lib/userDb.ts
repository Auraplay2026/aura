import { prisma } from './prisma';



export interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  side: 'yes' | 'no';
  shares: number;
  buyPrice: number;
  investment: number;
  timestamp: number;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade' | 'cashout' | 'casino';
  amount: number;
  balanceAfter: number;
  timestamp: number;
  details: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Processing';
  upiId?: string;
  utr?: string;
  screenshotUrl?: string;
}

export interface UserProfile {
  id?: string;
  username: string;
  email: string;
  passwordHash: string;
  accountType: 'demo' | 'real';
  balance: number;
  positions: Position[];
  transactions: Transaction[];
  demoBalance: number;
  demoPositions: Position[];
  demoTransactions: Transaction[];
  realBalance: number;
  realPositions: Position[];
  realTransactions: Transaction[];
  hasCompletedOnboarding?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  role?: 'user' | 'admin' | 'BANNED';
  kycStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNVERIFIED' | 'PROCESSING' | 'VERIFIED';
  kycDocumentUrl?: string | null;
  adminNotes?: string | null;
  phoneNumber?: string | null;
  gamingState?: string | null;
  upiId?: string | null;
  fullName?: string | null;
  dob?: string | null;
  address?: string | null;
  resetCode?: string | null;
  resetCodeExpires?: number | null;
  affiliateCode?: string | null;
  referredBy?: string | null;
  referralCount?: number;
  affiliateEarnings?: number;
  totalWagered?: number;
  vipLevel?: string;
  manualVipLevel?: string | null;
  vipRewardsClaimed?: Record<string, boolean> | null;
  notifications?: { id: string; message: string; timestamp: number; read: boolean }[];
  activityLogs?: any[];
}

export function sanitizeUserProfile(user: any): UserProfile {
  const accountType = user.accountType === 'real' ? 'real' : 'demo';
  const allPositions = user.positions || [];
  const allTransactions = user.transactions || [];

  const demoPositions = allPositions.filter((p: any) => p.walletType === 'demo');
  const demoTransactions = allTransactions.filter((t: any) => t.walletType === 'demo');
  const realPositions = allPositions.filter((p: any) => p.walletType === 'real');
  const realTransactions = allTransactions.filter((t: any) => t.walletType === 'real');

  return {
    ...user,
    email: user.email || user.username || "",
    accountType,
    balance: accountType === 'real' ? (user.realBalance ?? 0) : (user.demoBalance ?? 100000),
    positions: accountType === 'real' ? realPositions : demoPositions,
    transactions: accountType === 'real' ? realTransactions : demoTransactions,
    demoPositions,
    demoTransactions,
    realPositions,
    realTransactions,
    notifications: user.notifications || [],
    activityLogs: user.activityLogs || [],
    hasCompletedOnboarding: user.hasCompletedOnboarding !== false,
    role: user.role === 'admin' ? 'admin' : (user.role === 'BANNED' ? 'BANNED' : 'user'),
    kycStatus: user.kycStatus || 'NONE',
    twoFactorEnabled: !!user.twoFactorEnabled,
    vipLevel: user.vipLevel || 'Bronze',
  } as UserProfile;
}

export async function getUsers(): Promise<UserProfile[]> {
  const users = await prisma.user.findMany({
    include: { transactions: true, positions: true, notifications: true, activityLogs: true }
  });
  return users.map(sanitizeUserProfile);
}

export async function saveUsers(users: UserProfile[]) {
  // Deprecated: No longer used in Prisma. Database saves automatically via updateUser.
}

export async function findUserByEmail(email: string): Promise<UserProfile | undefined> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { transactions: true, positions: true, notifications: true }
  });
  if (user) return sanitizeUserProfile(user);

  return undefined;
}

export async function findUserByUsername(username: string): Promise<UserProfile | undefined> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { transactions: true, positions: true, notifications: true }
  });
  if (user) return sanitizeUserProfile(user);

  return undefined;
}

export async function findUserByEmailOrUsername(identifier: string): Promise<UserProfile | undefined> {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier }
      ]
    },
    include: { transactions: true, positions: true, notifications: true }
  });
  if (user) return sanitizeUserProfile(user);

  return undefined;
}

export async function addUser(user: UserProfile): Promise<void> {
  await prisma.user.create({
    data: {
      username: user.username,
      email: user.email,
      passwordHash: user.passwordHash,
      accountType: user.accountType,
      balance: user.balance,
      demoBalance: user.demoBalance,
      realBalance: user.realBalance,
      role: user.role || 'user',
      affiliateCode: user.affiliateCode || undefined,
      referredBy: user.referredBy || undefined,
    }
  });
}

export async function updateUser(email: string, updates: Partial<UserProfile>, parentTx?: any): Promise<UserProfile | null> {
  const runWithTx = async (tx: any) => {
    const existing = await tx.user.findFirst({
      where: {
        OR: [
          { email: { equals: email, mode: 'insensitive' } },
          { username: { equals: email, mode: 'insensitive' } }
        ]
      }
    });
    if (!existing) return null;

    const data: any = {};
    if (updates.passwordHash !== undefined) data.passwordHash = updates.passwordHash;
    if (updates.balance !== undefined) data.balance = updates.balance;
    if (updates.realBalance !== undefined) data.realBalance = updates.realBalance;
    if (updates.demoBalance !== undefined) data.demoBalance = updates.demoBalance;
    if (updates.role !== undefined) data.role = updates.role;
    if (updates.accountType !== undefined) data.accountType = updates.accountType;
    if (updates.kycStatus !== undefined) data.kycStatus = updates.kycStatus;
    if (updates.totalWagered !== undefined) data.totalWagered = updates.totalWagered;
    if (updates.vipLevel !== undefined) data.vipLevel = updates.vipLevel;
    if (updates.twoFactorEnabled !== undefined) data.twoFactorEnabled = updates.twoFactorEnabled;
    if (updates.hasCompletedOnboarding !== undefined) data.hasCompletedOnboarding = updates.hasCompletedOnboarding;
    if (updates.affiliateCode !== undefined) data.affiliateCode = updates.affiliateCode;
    if (updates.referredBy !== undefined) data.referredBy = updates.referredBy;
    if (updates.referralCount !== undefined) data.referralCount = updates.referralCount;
    if (updates.affiliateEarnings !== undefined) data.affiliateEarnings = updates.affiliateEarnings;
    if (updates.resetCode !== undefined) data.resetCode = updates.resetCode;
    if (updates.resetCodeExpires !== undefined) data.resetCodeExpires = updates.resetCodeExpires;
    if (updates.manualVipLevel !== undefined) data.manualVipLevel = updates.manualVipLevel;
    if (updates.vipRewardsClaimed !== undefined) data.vipRewardsClaimed = updates.vipRewardsClaimed;
    if (updates.adminNotes !== undefined) data.adminNotes = updates.adminNotes;
    if (updates.phoneNumber !== undefined) data.phoneNumber = updates.phoneNumber;
    if (updates.gamingState !== undefined) data.gamingState = updates.gamingState;
    if (updates.upiId !== undefined) data.upiId = updates.upiId;

    const txToProcess = [
      ...(updates.realTransactions || []),
      ...(updates.demoTransactions || []),
      ...(updates.transactions || [])
    ];

    if (txToProcess.length > 0) {
      const existingTx = await tx.transaction.findMany({ where: { userId: existing.id } });
      const existingIds = new Set(existingTx.map((t: any) => t.id));
      for (const newTx of txToProcess) {
        if (!existingIds.has(newTx.id)) {
          let wallet = 'real';
          if (updates.demoTransactions?.find((t: any) => t.id === newTx.id)) wallet = 'demo';
          
          await tx.transaction.create({
            data: {
              id: newTx.id,
              userId: existing.id,
              walletType: wallet,
              type: newTx.type,
              amount: newTx.amount,
              balanceAfter: newTx.balanceAfter,
              timestamp: newTx.timestamp,
              details: newTx.details,
              status: newTx.status,
              upiId: newTx.upiId,
              utr: newTx.utr,
              screenshotUrl: newTx.screenshotUrl
            }
          });
          existingIds.add(newTx.id);
        } else {
          // Sync changes in transaction details, status, or balanceAfter (e.g. from Pending to Completed/Failed)
          const currentTxInDb = existingTx.find((t: any) => t.id === newTx.id);
          if (currentTxInDb && (currentTxInDb.status !== newTx.status || currentTxInDb.details !== newTx.details || currentTxInDb.balanceAfter !== newTx.balanceAfter)) {
            await tx.transaction.update({
              where: { id: newTx.id },
              data: {
                status: newTx.status,
                details: newTx.details,
                balanceAfter: newTx.balanceAfter
              }
            });
          }
        }
      }
    }

    if (updates.notifications) {
      const existingNotifs = await tx.notification.findMany({ where: { userId: existing.id } });
      const existingIds = new Set(existingNotifs.map((n: any) => n.id));
      for (const n of updates.notifications) {
        if (!existingIds.has(n.id)) {
          await tx.notification.create({
            data: {
              id: n.id,
              userId: existing.id,
              message: n.message,
              timestamp: n.timestamp,
              read: n.read
            }
          });
          existingIds.add(n.id);
        }
      }
    }

    // Sync Real Positions if updates.realPositions is provided
    if (updates.realPositions !== undefined) {
      const existingRealPos = await tx.position.findMany({ 
        where: { userId: existing.id, walletType: 'real' } 
      });
      const existingRealIds = new Set(existingRealPos.map((p: any) => p.id));
      const incomingRealIds = new Set(updates.realPositions.map(p => p.id));

      // 1. Delete removed real positions
      for (const ep of existingRealPos) {
        if (!incomingRealIds.has(ep.id)) {
          await tx.position.delete({ where: { id: ep.id } });
        }
      }

      // 2. Create or update real positions
      for (const ip of updates.realPositions) {
        if (!existingRealIds.has(ip.id)) {
          await tx.position.create({
            data: {
              id: ip.id,
              userId: existing.id,
              walletType: 'real',
              marketId: ip.marketId,
              marketTitle: ip.marketTitle,
              side: ip.side,
              shares: ip.shares,
              buyPrice: ip.buyPrice,
              investment: ip.investment,
              timestamp: ip.timestamp
            }
          });
        } else {
          await tx.position.update({
            where: { id: ip.id },
            data: {
              shares: ip.shares,
              buyPrice: ip.buyPrice,
              investment: ip.investment
            }
          });
        }
      }
    }

    // Sync Demo Positions if updates.demoPositions is provided
    if (updates.demoPositions !== undefined) {
      const existingDemoPos = await tx.position.findMany({ 
        where: { userId: existing.id, walletType: 'demo' } 
      });
      const existingDemoIds = new Set(existingDemoPos.map((p: any) => p.id));
      const incomingDemoIds = new Set(updates.demoPositions.map(p => p.id));

      // 1. Delete removed demo positions
      for (const ep of existingDemoPos) {
        if (!incomingDemoIds.has(ep.id)) {
          await tx.position.delete({ where: { id: ep.id } });
        }
      }

      // 2. Create or update demo positions
      for (const ip of updates.demoPositions) {
        if (!existingDemoIds.has(ip.id)) {
          await tx.position.create({
            data: {
              id: ip.id,
              userId: existing.id,
              walletType: 'demo',
              marketId: ip.marketId,
              marketTitle: ip.marketTitle,
              side: ip.side,
              shares: ip.shares,
              buyPrice: ip.buyPrice,
              investment: ip.investment,
              timestamp: ip.timestamp
            }
          });
        } else {
          await tx.position.update({
            where: { id: ip.id },
            data: {
              shares: ip.shares,
              buyPrice: ip.buyPrice,
              investment: ip.investment
            }
          });
        }
      }
    }

    const updatedUser = await tx.user.update({
      where: { id: existing.id },
      data,
      include: { transactions: true, positions: true, notifications: true, activityLogs: true }
    });

    return sanitizeUserProfile(updatedUser);
  };

  if (parentTx) {
    return await runWithTx(parentTx);
  } else {
    return await prisma.$transaction(async (tx) => {
      return await runWithTx(tx);
    });
  }
}

export async function addActivityLog(
  identifier: string,
  log: { action: string; device: string; location: string; ip: string; type?: string }
): Promise<any> {
  if (!identifier) return null;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: 'insensitive' } },
        { username: { equals: identifier, mode: 'insensitive' } }
      ]
    }
  });
  if (!user) return null;

  return await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: log.action,
      device: log.device,
      location: log.location,
      ip: log.ip,
      timestamp: Date.now(),
      type: log.type || 'info'
    }
  });
}

export async function getActivityLogs(identifier: string): Promise<any[]> {
  if (!identifier) return [];
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: 'insensitive' } },
        { username: { equals: identifier, mode: 'insensitive' } }
      ]
    },
    include: {
      activityLogs: {
        orderBy: {
          timestamp: 'desc'
        }
      }
    }
  });
  return user?.activityLogs || [];
}
