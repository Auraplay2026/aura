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
  phoneNumber?: string;
  gamingState?: string;
  upiId?: string;
  fullName?: string;
  dob?: string;
  address?: string;
  role?: 'user' | 'admin' | 'BANNED';
  kycStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNVERIFIED' | 'PROCESSING' | 'VERIFIED';
  kycDocumentUrl?: string;
  notifications?: { id: string; message: string; timestamp: number; read: boolean }[];
  activityLogs?: any[];
  geoRestricted?: boolean;
  verifiedAge?: number;
  adminNotes?: string;
  affiliateCode?: string;
  referredBy?: string;
  referralCount?: number;
  affiliateEarnings?: number;
  totalWagered?: number;
  vipLevel?: string;
  manualVipLevel?: string;
  vipRewardsClaimed?: Record<string, boolean>;
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
    accountType,
    positions: accountType === 'real' ? realPositions : demoPositions,
    transactions: accountType === 'real' ? realTransactions : demoTransactions,
    demoPositions,
    demoTransactions,
    realPositions,
    realTransactions,
    notifications: user.notifications || [],
    activityLogs: user.activityLogs || [],
    hasCompletedOnboarding: !!user.hasCompletedOnboarding,
    role: user.email === 'twintubrovquattro@gmail.com' ? 'admin' : user.role,
    kycStatus: user.kycStatus || 'NONE',
    affiliateEarnings: user.affiliateEarnings || 0,
    referralCount: user.referralCount || 0,
    fullName: user.fullName || "",
    dob: user.dob || "",
    address: user.address || "",
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
  return user ? sanitizeUserProfile(user) : undefined;
}

export async function findUserByUsername(username: string): Promise<UserProfile | undefined> {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { transactions: true, positions: true, notifications: true }
  });
  return user ? sanitizeUserProfile(user) : undefined;
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
  return user ? sanitizeUserProfile(user) : undefined;
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
    }
  });
}

export async function updateUser(email: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({ where: { email } });
    if (!existing) return null;

    const data: any = {};
    if (updates.balance !== undefined) data.balance = updates.balance;
    if (updates.realBalance !== undefined) data.realBalance = updates.realBalance;
    if (updates.demoBalance !== undefined) data.demoBalance = updates.demoBalance;
    if (updates.role !== undefined) data.role = updates.role;
    if (updates.accountType !== undefined) data.accountType = updates.accountType;
    if (updates.kycStatus !== undefined) data.kycStatus = updates.kycStatus;
    if (updates.kycDocumentUrl !== undefined) data.kycDocumentUrl = updates.kycDocumentUrl;
    if (updates.adminNotes !== undefined) data.adminNotes = updates.adminNotes;
    if (updates.affiliateEarnings !== undefined) data.affiliateEarnings = updates.affiliateEarnings;
    if (updates.referralCount !== undefined) data.referralCount = updates.referralCount;
    if (updates.totalWagered !== undefined) data.totalWagered = updates.totalWagered;
    if (updates.vipLevel !== undefined) data.vipLevel = updates.vipLevel;
    if (updates.fullName !== undefined) data.fullName = updates.fullName;
    if (updates.dob !== undefined) data.dob = updates.dob;
    if (updates.address !== undefined) data.address = updates.address;
    if (updates.hasCompletedOnboarding !== undefined) data.hasCompletedOnboarding = updates.hasCompletedOnboarding;
    if (updates.phoneNumber !== undefined) data.phoneNumber = updates.phoneNumber;
    if (updates.gamingState !== undefined) data.gamingState = updates.gamingState;
    if (updates.upiId !== undefined) data.upiId = updates.upiId;
    if (updates.manualVipLevel !== undefined) data.manualVipLevel = updates.manualVipLevel;
    if (updates.vipRewardsClaimed !== undefined) data.vipRewardsClaimed = updates.vipRewardsClaimed;

    const txToProcess = [
      ...(updates.realTransactions || []),
      ...(updates.demoTransactions || []),
      ...(updates.transactions || [])
    ];

    if (txToProcess.length > 0) {
      const existingTx = await tx.transaction.findMany({ where: { userId: existing.id } });
      const existingIds = new Set(existingTx.map(t => t.id));
      for (const newTx of txToProcess) {
        if (!existingIds.has(newTx.id)) {
          let wallet = 'real';
          if (updates.demoTransactions?.find(t => t.id === newTx.id)) wallet = 'demo';
          
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
        }
      }
    }

    if (updates.notifications) {
      const existingNotifs = await tx.notification.findMany({ where: { userId: existing.id } });
      const existingIds = new Set(existingNotifs.map(n => n.id));
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

    const updatedUser = await tx.user.update({
      where: { email },
      data,
      include: { transactions: true, positions: true, notifications: true, activityLogs: true }
    });

    return sanitizeUserProfile(updatedUser);
  });
}

export async function addActivityLog(
  email: string,
  log: { action: string; device: string; location: string; ip: string; type?: string }
): Promise<any> {
  const user = await prisma.user.findUnique({ where: { email } });
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

export async function getActivityLogs(email: string): Promise<any[]> {
  const user = await prisma.user.findUnique({
    where: { email },
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
