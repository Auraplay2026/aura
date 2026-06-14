import fs from 'fs';
import path from 'path';

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
  
  // Active pointers (legacy compatibility)
  balance: number;
  positions: Position[];
  transactions: Transaction[];

  // Demo Wallet
  demoBalance: number;
  demoPositions: Position[];
  demoTransactions: Transaction[];

  // Real Wallet
  realBalance: number;
  realPositions: Position[];
  realTransactions: Transaction[];

  hasCompletedOnboarding?: boolean;
  phoneNumber?: string;
  gamingState?: string;
  upiId?: string;
  role?: 'user' | 'admin' | 'BANNED';
  kycStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  kycDocumentUrl?: string;
  notifications?: { id: string; message: string; timestamp: number; read: boolean }[];
  adminNotes?: string;

  // Affiliate System
  affiliateCode?: string;
  referredBy?: string;
  referralCount?: number;
  affiliateEarnings?: number;

  // VIP System
  totalWagered?: number;
  vipLevel?: string;
  manualVipLevel?: string;
  vipRewardsClaimed?: Record<string, boolean>;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'users.json');

const DEFAULT_DEMO_USER: UserProfile = {
  username: "DemoPlayer",
  email: "demo@aurabet.io",
  passwordHash: "password123",
  accountType: 'demo',
  balance: 100000,
  positions: [],
  transactions: [],
  demoBalance: 100000,
  demoPositions: [],
  demoTransactions: [],
  realBalance: 0,
  realPositions: [],
  realTransactions: [],
  hasCompletedOnboarding: false,
  phoneNumber: '',
  gamingState: '',
  upiId: '',
  role: 'user',
  affiliateCode: 'DEMO500',
  referredBy: '',
  referralCount: 12,
  affiliateEarnings: 45250
};

const DEFAULT_ADMIN_USER: UserProfile = {
  username: "Admin",
  email: "admin@aurabet.io",
  passwordHash: "admin123",
  accountType: 'real',
  balance: 0,
  positions: [],
  transactions: [],
  demoBalance: 100000,
  demoPositions: [],
  demoTransactions: [],
  realBalance: 0,
  realPositions: [],
  realTransactions: [],
  hasCompletedOnboarding: true,
  phoneNumber: '9999999999',
  gamingState: 'Maharashtra',
  upiId: 'admin@okaxis',
  role: 'admin',
  affiliateCode: 'ADMIN123',
  referredBy: '',
  referralCount: 154,
  affiliateEarnings: 1250000
};

// Ensure database directory and file exist
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialUsers = [DEFAULT_DEMO_USER, DEFAULT_ADMIN_USER];
    fs.writeFileSync(DB_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');
  } else {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const users = JSON.parse(data);
      let modified = false;
      if (Array.isArray(users)) {
        if (!users.some(u => u.email.toLowerCase() === 'admin@aurabet.io')) {
          users.push(DEFAULT_ADMIN_USER);
          modified = true;
        }
        if (modified) {
          fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
        }
      }
    } catch (e) {
      console.error("Failed to initialize database users", e);
    }
  }
}


export function sanitizeUserProfile(user: any): UserProfile {
  const accountType = user.accountType === 'real' ? 'real' : 'demo';
  const demoBalance = typeof user.demoBalance === 'number' ? user.demoBalance : 100000;
  const demoPositions = Array.isArray(user.demoPositions) ? user.demoPositions : [];
  const demoTransactions = Array.isArray(user.demoTransactions) ? user.demoTransactions : [];
  
  const realBalance = typeof user.realBalance === 'number' ? user.realBalance : 0;
  const realPositions = Array.isArray(user.realPositions) ? user.realPositions : [];
  const realTransactions = Array.isArray(user.realTransactions) ? user.realTransactions : [];
  
  const balance = typeof user.balance === 'number' 
    ? user.balance 
    : (accountType === 'real' ? realBalance : demoBalance);
    
  const positions = Array.isArray(user.positions)
    ? user.positions
    : (accountType === 'real' ? realPositions : demoPositions);
    
  const transactions = Array.isArray(user.transactions)
    ? user.transactions
    : (accountType === 'real' ? realTransactions : demoTransactions);

  return {
    username: user.username || 'Player',
    email: user.email || '',
    passwordHash: user.passwordHash || '',
    accountType,
    balance,
    positions,
    transactions,
    demoBalance,
    demoPositions,
    demoTransactions,
    realBalance,
    realPositions,
    realTransactions,
    hasCompletedOnboarding: !!user.hasCompletedOnboarding,
    phoneNumber: user.phoneNumber || '',
    gamingState: user.gamingState || '',
    upiId: user.upiId || '',
    role: user.role === 'admin' ? 'admin' : (user.role === 'BANNED' ? 'BANNED' : 'user'),
    kycStatus: user.kycStatus || 'NONE',
    kycDocumentUrl: user.kycDocumentUrl || '',
    notifications: Array.isArray(user.notifications) ? user.notifications : [],
    adminNotes: user.adminNotes || '',
    affiliateCode: user.affiliateCode || '',
    referredBy: user.referredBy || '',
    referralCount: typeof user.referralCount === 'number' ? user.referralCount : 0,
    affiliateEarnings: typeof user.affiliateEarnings === 'number' ? user.affiliateEarnings : 0
  };
}

export function getUsers(): UserProfile[] {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      let needsSave = false;
      const users = parsed.map(u => {
        if (!u.affiliateCode && u.username) {
          u.affiliateCode = u.username.substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
          needsSave = true;
        }
        return sanitizeUserProfile(u);
      });
      if (needsSave) {
        // Run save asynchronously to not block, but we still return the patched users
        setTimeout(() => saveUsers(users), 0);
      }
      return users;
    }
    return [DEFAULT_DEMO_USER];
  } catch (err) {
    console.error("Failed to read users database", err);
    return [DEFAULT_DEMO_USER];
  }
}

export function saveUsers(users: UserProfile[]) {
  initDb();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to write users database", err);
  }
}

export function findUserByEmail(email: string): UserProfile | undefined {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserByUsername(username: string): UserProfile | undefined {
  const users = getUsers();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserByEmailOrUsername(identifier: string): UserProfile | undefined {
  const users = getUsers();
  return users.find(u => 
    u.email.toLowerCase() === identifier.toLowerCase() || 
    u.username.toLowerCase() === identifier.toLowerCase()
  );
}

export function addUser(user: UserProfile) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
}

export function updateUser(email: string, updates: Partial<UserProfile>) {
  const users = getUsers();
  const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    saveUsers(users);
    return users[index];
  }
  return null;
}
