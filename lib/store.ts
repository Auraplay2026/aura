import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recordGameRound } from './recordRound';
import { ACHIEVEMENTS } from './achievements';
import { checkStreak } from './streakEngine';
import { GAMES } from './games';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'trade' | 'cashout' | 'casino';
  amount: number;
  balanceAfter: number;
  timestamp: number;
  details: string; // e.g. "UPI Deposit", "Bought 50 shares of India vs Pak"
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  side: 'yes' | 'no';
  shares: number; // Number of shares bought
  buyPrice: number; // Price per share at time of purchase
  investment: number; // Total amount invested (shares * buyPrice)
  timestamp: number; // Unix timestamp
}

export interface UserProfile {
  username: string;
  email: string;
  accountType: 'demo' | 'real';
  balance: number;
  positions: Position[];
  transactions: Transaction[];
  hasCompletedOnboarding?: boolean;
  phoneNumber?: string;
  gamingState?: string;
  upiId?: string;
  fullName?: string;
  dob?: string;
  address?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  role?: 'user' | 'admin';
  kycStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNVERIFIED' | 'PROCESSING' | 'VERIFIED';
  kycDocumentUrl?: string;
  notifications?: { id: string; message: string; timestamp: number; read: boolean }[];
  activityLogs?: any[];
  geoRestricted?: boolean;
  verifiedAge?: number;
  kycSubmittedAt?: number | null;
  adminNotes?: string;
  affiliateCode?: string;
  referredBy?: string;
  referralCount?: number;
  affiliateEarnings?: number;
  
  // VIP System
  totalWagered?: number;
  vipLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  manualVipLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  vipRewardsClaimed?: Record<string, boolean>;
  
  // Wallet states
  demoBalance: number;
  demoPositions: Position[];
  demoTransactions: Transaction[];
  realBalance: number;
  realPositions: Position[];
  realTransactions: Transaction[];
}

interface TradingState {
  balance: number;
  positions: Position[];
  transactions: Transaction[];
  
  // Active session profile
  currentUser: UserProfile | null;
  isLoggedIn: boolean;

  // New strict typing tracking fields
  kycStatus: 'UNVERIFIED' | 'PROCESSING' | 'VERIFIED' | 'REJECTED';
  geoRestricted: boolean;
  verifiedAge: number;
  activityLogs: any[];
  kycSubmittedAt: number | null;
  processedUuids: string[];

  // Daily Streak
  streakCount: number;
  lastLoginDate: string | null;
  claimedToday: boolean;
  spinWheelClaimedToday: boolean;
  dailyModalLastDismissedDate: string | null;

  // Achievements
  unlockedAchievements: string[];
  xp: number;
  points: number;
  latestAchievementUnlocked: any | null;
  winStreakCount: number;
  predictionWinStreak: number;
  latestWinCelebration: { amount: number; gameTitle: string } | null;

  // Actions
  deposit: (amount: number, method?: string) => void;
  placeTrade: (marketId: string, marketTitle: string, side: 'yes' | 'no', investment: number, currentPrice: number, uuid?: string) => void;
  cashOut: (positionId: string, currentMarketPrice: number) => void;
  repairState: () => void;
  syncFromServer: () => Promise<void>;
  
  // Auth Actions
  login: () => Promise<void>;
  logout: () => void;
  signUp: (username: string, email: string, passwordHash: string, accountType?: 'demo' | 'real', referralCode?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (emailOrUsername: string, passwordHash: string, otp?: string) => Promise<{ success: boolean; error?: string; twoFactorRequired?: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  setup2fa: () => Promise<{ success: boolean; secret?: string; keyUri?: string; error?: string }>;
  verifyAndEnable2fa: (token: string, secret: string) => Promise<{ success: boolean; error?: string }>;
  disable2fa: (token: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, username: string) => Promise<{ success: boolean; error?: string }>;
  switchAccountType: (type: 'demo' | 'real') => Promise<void>;
  completeOnboarding: (phoneNumber?: string, gamingState?: string, upiId?: string) => Promise<void>;
  updateProfile: (updates: { username?: string; phoneNumber?: string; upiId?: string; gamingState?: string; fullName?: string; dob?: string; address?: string; twoFactorEnabled?: boolean; notifications?: { id: string; message: string; timestamp: number; read: boolean; title?: string }[] }) => Promise<boolean>;
  setKycStatus: (status: 'UNVERIFIED' | 'PROCESSING' | 'VERIFIED' | 'REJECTED') => void;
  setKycSubmittedAt: (time: number | null) => void;
  setGeoRestricted: (restricted: boolean) => void;
  setVerifiedAge: (age: number) => void;
  fetchActivityLogs: () => Promise<void>;

  // Sportsbook
  placeSportsBet: (matchTitle: string, selection: string, odds: number, stake: number, side?: 'yes' | 'no', uuid?: string) => void;
  cancelSportsBet: (transactionId: string) => void;

  // Casino
  playCasino: (wager: number, payout: number, gameTitle: string, uuid?: string) => void;
  houseEdge: number;
  fetchSystemConfig: () => Promise<void>;

  // Daily Streak & Spin Actions
  checkDailyStreak: () => void;
  claimDailyReward: () => void;
  spinWheelClaimed: (prizeAmount: number, prizeName: string) => void;
  unlockAchievement: (id: string) => void;
  clearLatestAchievement: () => void;
  clearLatestWinCelebration: () => void;
  dismissDailyModal: () => void;
}

// Helper to determine VIP Level based on total wagered
export function calculateVipLevel(wagered: number, manualLevel?: string) {
  if (manualLevel) return manualLevel;
  if (wagered >= 5000000) return 'Diamond';
  if (wagered >= 1000000) return 'Platinum';
  if (wagered >= 250000) return 'Gold';
  if (wagered >= 50000) return 'Silver';
  return 'Bronze';
}

// Background utility to sync client state modifications to the server database
function syncWithServer(
  email: string, 
  accountType: 'demo' | 'real', 
  balance: number, 
  positions: Position[], 
  transactions: Transaction[],
  hasCompletedOnboarding?: boolean,
  phoneNumber?: string,
  gamingState?: string,
  upiId?: string,
  totalWagered?: number,
  vipLevel?: string,
  manualVipLevel?: string,
  vipRewardsClaimed?: Record<string, boolean>
) {
  fetch('/api/auth/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email, 
      accountType, 
      balance, 
      positions, 
      transactions, 
      hasCompletedOnboarding,
      phoneNumber,
      gamingState,
      upiId,
      totalWagered,
      vipLevel,
      manualVipLevel,
      vipRewardsClaimed
    })
  }).catch(err => console.error("Failed to sync state to server database", err));
}

// Helper function to update state and trigger server-side sync
function getSyncedStateAndSync(
  state: TradingState,
  newBalance: number,
  newTransactions: Transaction[],
  newPositions?: Position[]
) {
  const roundedBalance = Math.round(newBalance * 100) / 100;
  const positionsToUse = newPositions !== undefined ? newPositions : state.positions;
  
  if (state.isLoggedIn && state.currentUser) {
    const accountType = state.currentUser.accountType || 'demo';
    const hasCompletedOnboarding = state.currentUser.hasCompletedOnboarding;
    const { phoneNumber, gamingState, upiId, totalWagered, vipLevel, manualVipLevel, vipRewardsClaimed } = state.currentUser;
    syncWithServer(
      state.currentUser.email, 
      accountType, 
      roundedBalance, 
      positionsToUse, 
      newTransactions, 
      hasCompletedOnboarding,
      phoneNumber,
      gamingState,
      upiId,
      totalWagered,
      vipLevel,
      manualVipLevel,
      vipRewardsClaimed
    );
  }
  
  return {
    balance: roundedBalance,
    transactions: newTransactions,
    positions: positionsToUse,
    currentUser: state.currentUser 
      ? { ...state.currentUser, balance: roundedBalance, transactions: newTransactions, positions: positionsToUse }
      : null
  };
}

export function mapKycStatus(status?: string): 'UNVERIFIED' | 'PROCESSING' | 'VERIFIED' | 'REJECTED' {
  if (!status) return 'UNVERIFIED';
  const s = status.toUpperCase();
  if (s === 'APPROVED' || s === 'VERIFIED') return 'VERIFIED';
  if (s === 'PENDING' || s === 'PROCESSING') return 'PROCESSING';
  if (s === 'REJECTED') return 'REJECTED';
  return 'UNVERIFIED';
}

export function sanitizeClientUserProfile(user: any): UserProfile | null {
  if (!user) return null;
  const coerce = (val: any) => typeof val === 'number' ? val : (parseFloat(String(val)) || 0);
  return {
    ...user,
    balance: coerce(user.balance),
    demoBalance: coerce(user.demoBalance),
    realBalance: coerce(user.realBalance),
    totalWagered: coerce(user.totalWagered),
    affiliateEarnings: coerce(user.affiliateEarnings),
  };
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      balance: 100000, // Start with ₹100,000 Trading Power
      positions: [],
      transactions: [],
      currentUser: null,
      isLoggedIn: false, // Default to logged out
      kycStatus: 'UNVERIFIED',
      geoRestricted: false,
      verifiedAge: 0,
      activityLogs: [],
      kycSubmittedAt: null,
      processedUuids: [],
      houseEdge: 2.0, // Default 2% house edge

      // Daily Streak & Spin states
      streakCount: 0,
      lastLoginDate: null,
      claimedToday: false,
      spinWheelClaimedToday: false,
      dailyModalLastDismissedDate: null,

      // Achievements states
      unlockedAchievements: [],
      xp: 0,
      points: 0,
      latestAchievementUnlocked: null,
      winStreakCount: 0,
      predictionWinStreak: 0,
      latestWinCelebration: null,

      // Backend-supported legacy login compatibility (logs in as demo user via API)
      login: async () => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrUsername: 'demo@aurabet.io', password: 'password123' })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            const sanitizedUser = sanitizeClientUserProfile(data.user);
            set({
              currentUser: sanitizedUser,
              isLoggedIn: true,
              balance: sanitizedUser ? sanitizedUser.balance : 0,
              positions: data.user.positions,
              transactions: data.user.transactions,
              kycStatus: mapKycStatus(sanitizedUser?.kycStatus),
              geoRestricted: sanitizedUser?.geoRestricted || false,
              verifiedAge: sanitizedUser?.verifiedAge || 0,
            });
          }
        } catch (err) {
          console.error("Auto-login request failed", err);
        }
      },

      syncFromServer: async () => {
        const state = useTradingStore.getState();
        if (!state.isLoggedIn || !state.currentUser) return;
        
        try {
          const res = await fetch('/api/auth/me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: state.currentUser.email })
          });
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            const sanitizedUser = sanitizeClientUserProfile(data.user);
            set({
              currentUser: sanitizedUser,
              balance: sanitizedUser ? sanitizedUser.balance : 0,
              positions: data.user.positions,
              transactions: data.user.transactions,
              kycStatus: mapKycStatus(sanitizedUser?.kycStatus),
              geoRestricted: sanitizedUser?.geoRestricted || false,
              verifiedAge: sanitizedUser?.verifiedAge || 0,
            });
          }
        } catch (err) {
          console.error("Failed to sync from server", err);
        }
      },

      logout: () => set({
        isLoggedIn: false,
        currentUser: null,
        balance: 100000,
        positions: [],
        transactions: []
      }),

      signUp: async (username, email, password, accountType = 'demo', referralCode = '') => {
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, accountType, referralCode })
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || "Signup failed." };
          }
          
          const sanitizedUser = sanitizeClientUserProfile(data.user);
          set({
            currentUser: sanitizedUser,
            isLoggedIn: true,
            balance: sanitizedUser ? sanitizedUser.balance : 0,
            positions: data.user.positions,
            transactions: data.user.transactions,
            kycStatus: mapKycStatus(sanitizedUser?.kycStatus),
            geoRestricted: sanitizedUser?.geoRestricted || false,
            verifiedAge: sanitizedUser?.verifiedAge || 0,
          });
          return { success: true };
        } catch (err) {
          return { success: false, error: "Network error. Please try again." };
        }
      },

      loginWithCredentials: async (emailOrUsername, password, otp) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrUsername, password, otp })
          });
          const data = await res.json();
          if (data && data.twoFactorRequired) {
            return { success: false, twoFactorRequired: true };
          }
          if (!res.ok) {
            return { success: false, error: data.error || "Login failed." };
          }
          
          const sanitizedUser = sanitizeClientUserProfile(data.user);
          set({
            currentUser: sanitizedUser,
            isLoggedIn: true,
            balance: sanitizedUser ? sanitizedUser.balance : 0,
            positions: data.user.positions,
            transactions: data.user.transactions,
            kycStatus: mapKycStatus(sanitizedUser?.kycStatus),
            geoRestricted: sanitizedUser?.geoRestricted || false,
            verifiedAge: sanitizedUser?.verifiedAge || 0,
          });
          return { success: true };
        } catch (err) {
          return { success: false, error: "Network error. Please try again." };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        const currentUser = get().currentUser;
        if (!currentUser) return { success: false, error: "Not logged in." };
        try {
          const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, currentPassword, newPassword })
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || "Failed to change password." };
          }
          return { success: true };
        } catch (err) {
          return { success: false, error: "Network error. Please try again." };
        }
      },

      setup2fa: async () => {
        const currentUser = get().currentUser;
        if (!currentUser) return { success: false, error: "Not logged in." };
        try {
          const res = await fetch('/api/auth/2fa/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || "Failed to setup 2FA." };
          }
          return { success: true, secret: data.secret, keyUri: data.keyUri };
        } catch (err) {
          return { success: false, error: "Network error. Please try again." };
        }
      },

      verifyAndEnable2fa: async (token, secret) => {
        const currentUser = get().currentUser;
        if (!currentUser) return { success: false, error: "Not logged in." };
        try {
          const res = await fetch('/api/auth/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, token, secret, enable: true })
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || "Failed to verify code." };
          }
          
          set((state) => {
            if (!state.currentUser) return {};
            return {
              currentUser: {
                ...state.currentUser,
                twoFactorEnabled: true,
                twoFactorSecret: secret
              }
            };
          });
          return { success: true };
        } catch (err) {
          return { success: false, error: "Network error. Please try again." };
        }
      },

      disable2fa: async (token) => {
        const currentUser = get().currentUser;
        if (!currentUser) return { success: false, error: "Not logged in." };
        try {
          const res = await fetch('/api/auth/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, token, enable: false })
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || "Failed to verify code." };
          }
          
          set((state) => {
            if (!state.currentUser) return {};
            return {
              currentUser: {
                ...state.currentUser,
                twoFactorEnabled: false,
                twoFactorSecret: undefined
              }
            };
          });
          return { success: true };
        } catch (err) {
          return { success: false, error: "Network error. Please try again." };
        }
      },

      loginWithGoogle: async (email, username) => {
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name: username })
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || "Google login failed." };
          }
          
          const sanitizedUser = sanitizeClientUserProfile(data.user);
          set({
            currentUser: sanitizedUser,
            isLoggedIn: true,
            balance: sanitizedUser ? sanitizedUser.balance : 0,
            positions: data.user.positions,
            transactions: data.user.transactions,
            kycStatus: mapKycStatus(sanitizedUser?.kycStatus),
            geoRestricted: sanitizedUser?.geoRestricted || false,
            verifiedAge: sanitizedUser?.verifiedAge || 0,
          });
          return { success: true };
        } catch (err) {
          return { success: false, error: "Network error. Please try again." };
        }
      },

      switchAccountType: async (type) => {
        let emailToSync = "";
        let syncPayload: any = null;
        
        set((state) => {
          if (!state.isLoggedIn || !state.currentUser) return {};
          
          const user = state.currentUser;
          const currentType = user.accountType;
          
          // 1. Save the current active states into their respective isolated wallets
          const updatedUser = { ...user };
          const coerce = (val: any) => typeof val === 'number' ? val : (parseFloat(String(val)) || 0);
          if (currentType === 'real') {
            updatedUser.realBalance = coerce(state.balance);
            updatedUser.realPositions = state.positions;
            updatedUser.realTransactions = state.transactions;
          } else {
            updatedUser.demoBalance = coerce(state.balance);
            updatedUser.demoPositions = state.positions;
            updatedUser.demoTransactions = state.transactions;
          }
          
          // 2. Select the target wallet type
          const targetType = type;
          updatedUser.accountType = targetType;
          
          const nextBalance = coerce(targetType === 'real' ? updatedUser.realBalance : updatedUser.demoBalance);
          const nextPositions = targetType === 'real' ? updatedUser.realPositions : updatedUser.demoPositions;
          const nextTransactions = targetType === 'real' ? updatedUser.realTransactions : updatedUser.demoTransactions;
          
          updatedUser.balance = nextBalance;
          updatedUser.positions = nextPositions;
          updatedUser.transactions = nextTransactions;
          
          emailToSync = user.email;
          syncPayload = {
            email: user.email,
            accountType: targetType,
            balance: nextBalance,
            positions: nextPositions,
            transactions: nextTransactions,
            hasCompletedOnboarding: user.hasCompletedOnboarding
          };
          
          return {
            currentUser: updatedUser,
            balance: nextBalance,
            positions: nextPositions,
            transactions: nextTransactions
          };
        });
        
        if (emailToSync && syncPayload) {
          try {
            await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(syncPayload)
            });
          } catch (err) {
            console.error("Failed to sync account type switch to server database", err);
          }
        }
      },

      completeOnboarding: async (phoneNumber, gamingState, upiId) => {
        let emailToSync = "";
        let syncPayload: any = null;
        
        set((state) => {
          if (!state.isLoggedIn || !state.currentUser) return {};
          
          const updatedUser = { 
            ...state.currentUser, 
            hasCompletedOnboarding: true,
            phoneNumber: phoneNumber || state.currentUser.phoneNumber,
            gamingState: gamingState || state.currentUser.gamingState,
            upiId: upiId || state.currentUser.upiId
          };
          
          emailToSync = updatedUser.email;
          syncPayload = {
            email: updatedUser.email,
            accountType: updatedUser.accountType,
            balance: state.balance,
            positions: state.positions,
            transactions: state.transactions,
            hasCompletedOnboarding: true,
            phoneNumber: updatedUser.phoneNumber,
            gamingState: updatedUser.gamingState,
            upiId: updatedUser.upiId
          };
          
          return {
            currentUser: updatedUser
          };
        });
        
        if (emailToSync && syncPayload) {
          try {
            await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(syncPayload)
            });
          } catch (err) {
            console.error("Failed to sync onboarding completion to server database", err);
          }
        }
      },

      updateProfile: async (updates) => {
        let emailToSync = "";
        let syncPayload: any = null;
        
        set((state) => {
          if (!state.isLoggedIn || !state.currentUser) return {};
          
          const updatedUser = { 
            ...state.currentUser,
            username: updates.username !== undefined ? updates.username : state.currentUser.username,
            phoneNumber: updates.phoneNumber !== undefined ? updates.phoneNumber : state.currentUser.phoneNumber,
            upiId: updates.upiId !== undefined ? updates.upiId : state.currentUser.upiId,
            gamingState: updates.gamingState !== undefined ? updates.gamingState : state.currentUser.gamingState,
            fullName: updates.fullName !== undefined ? updates.fullName : state.currentUser.fullName,
            dob: updates.dob !== undefined ? updates.dob : state.currentUser.dob,
            address: updates.address !== undefined ? updates.address : state.currentUser.address,
            twoFactorEnabled: updates.twoFactorEnabled !== undefined ? updates.twoFactorEnabled : state.currentUser.twoFactorEnabled,
            notifications: updates.notifications !== undefined ? updates.notifications : state.currentUser.notifications
          };
          
          emailToSync = updatedUser.email;
          syncPayload = {
            email: updatedUser.email,
            username: updatedUser.username,
            accountType: updatedUser.accountType,
            balance: state.balance,
            positions: state.positions,
            transactions: state.transactions,
            hasCompletedOnboarding: updatedUser.hasCompletedOnboarding,
            phoneNumber: updatedUser.phoneNumber,
            gamingState: updatedUser.gamingState,
            upiId: updatedUser.upiId,
            fullName: updatedUser.fullName,
            dob: updatedUser.dob,
            address: updatedUser.address,
            twoFactorEnabled: updatedUser.twoFactorEnabled,
            notifications: updatedUser.notifications
          };
          
          return {
            currentUser: updatedUser
          };
        });
        
        if (emailToSync && syncPayload) {
          try {
            const res = await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(syncPayload)
            });
            return res.ok;
          } catch (err) {
            console.error("Failed to sync profile update to server database", err);
            return false;
          }
        }
        return false;
      },

      deposit: (amount, method = 'UPI') => set((state) => {
        // --- State Repair logic ---
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }
        
        if (typeof amount !== 'number' || isNaN(amount)) return state;

        const isWithdrawal = amount < 0;
        const absAmount = Math.abs(amount);

        // Security check: Prevent overdrafts on withdrawal
        if (isWithdrawal && absAmount > safeBalance) {
          console.error("Insufficient balance for withdrawal");
          return state;
        }

        const newBalance = safeBalance + amount;
        
        const tx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: isWithdrawal ? 'withdraw' : 'deposit',
          amount: absAmount,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `${method.toUpperCase()} ${isWithdrawal ? 'Withdrawal' : 'Deposit'}`,
          status: 'Completed'
        };

        const newTransactions = [tx, ...state.transactions];
        return getSyncedStateAndSync(state, newBalance, newTransactions);
      }),

      placeTrade: (marketId, marketTitle, side, investment, currentPrice, uuid) => set((state) => {
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }

        // Idempotency check
        if (uuid) {
          if (state.processedUuids && state.processedUuids.includes(uuid)) {
            console.warn(`[Idempotency Block] placeTrade already processed for UUID: ${uuid}`);
            return state;
          }
        }

        // Security check: Prevent overdrafts and negative wagers
        if (investment <= 0 || investment > safeBalance) {
          console.error("Invalid investment amount or insufficient balance");
          return state;
        }

        // Anti-Arbitrage check: Look for mirror position in last 10 seconds
        const tenSecondsAgo = Date.now() - 10000;
        const mirrorPosition = state.positions.find(
          p => p.marketId === marketId && p.side !== side && p.timestamp >= tenSecondsAgo
        );
        if (mirrorPosition) {
          const alertMsg = `[Anti-Arbitrage Flag] User placed mirror prediction bets (YES and NO) on market "${marketTitle}" (ID: ${marketId}) within 10 seconds.`;
          console.warn(alertMsg);
          const newLog = {
            id: `LOG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            type: 'ARBITRAGE_ALERT',
            message: alertMsg,
            timestamp: Date.now()
          };
          state.activityLogs = [newLog, ...(state.activityLogs || [])];
        }

        const shares = investment / (currentPrice / 100);
        
        const newPosition: Position = {
          id: Math.random().toString(36).substring(2, 9),
          marketId,
          marketTitle,
          side,
          shares,
          buyPrice: currentPrice,
          investment,
          timestamp: Date.now()
        };

        const newBalance = safeBalance - investment;

        const tx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: 'trade',
          amount: investment,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `Bought ${shares.toFixed(1)} shares of ${marketTitle} (${side.toUpperCase()})`,
          status: 'Completed'
        };

        if (state.currentUser?.accountType === 'real') {
          recordGameRound({
            gameId: 'predictions',
            userId: state.currentUser.email,
            wager: investment,
            payout: 0, 
            multiplier: 0,
            won: false,
          });
        }

        let newTotalWagered = state.currentUser?.totalWagered || 0;
        let newVipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' = state.currentUser?.vipLevel || 'Bronze';
        if (state.currentUser) {
          if (state.currentUser.accountType === 'real') {
            newTotalWagered += investment;
            newVipLevel = calculateVipLevel(newTotalWagered, state.currentUser.manualVipLevel) as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
            state.currentUser.totalWagered = newTotalWagered;
            state.currentUser.vipLevel = newVipLevel;
          }
        }

        const newTransactions = [tx, ...state.transactions];
        const newPositions = [newPosition, ...state.positions];

        const syncedState = getSyncedStateAndSync(state, newBalance, newTransactions, newPositions);
        const nextProcessed = uuid ? [...(state.processedUuids || []), uuid].slice(-200) : (state.processedUuids || []);
        
        return {
          ...syncedState,
          processedUuids: nextProcessed,
          activityLogs: state.activityLogs
        };
      }),

      placeSportsBet: (matchTitle, selection, odds, stake, side, uuid) => set((state) => {
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }

        // Idempotency check
        if (uuid) {
          if (state.processedUuids && state.processedUuids.includes(uuid)) {
            console.warn(`[Idempotency Block] placeSportsBet already processed for UUID: ${uuid}`);
            return state;
          }
        }

        // Calculate potential liability and total balance requirement
        // Lay bet liability: Liability = Stake * (Odds - 1)
        const potentialLiability = side === 'no' ? stake * (odds - 1) : 0;
        const totalRequired = stake + potentialLiability;

        // Security check: Prevent overdrafts and negative wagers
        if (stake <= 0 || totalRequired > safeBalance) {
          console.error("Invalid stake amount or insufficient balance for stake + liability");
          return state;
        }

        // Anti-Arbitrage check: Look for mirror sports bet in last 10 seconds
        const tenSecondsAgo = Date.now() - 10000;
        const mirrorSportsBet = state.transactions.find(t => 
          t.type === 'trade' && 
          t.timestamp >= tenSecondsAgo && 
          t.details.includes(matchTitle) && 
          ((side === 'yes' && t.details.includes('Lay')) || (side === 'no' && (t.details.includes('Back') || t.details.includes('bet on'))))
        );
        if (mirrorSportsBet) {
          const alertMsg = `[Anti-Arbitrage Flag] User placed mirror sports bets (Back and Lay) on match "${matchTitle}" within 10 seconds.`;
          console.warn(alertMsg);
          const newLog = {
            id: `LOG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            type: 'ARBITRAGE_ALERT',
            message: alertMsg,
            timestamp: Date.now()
          };
          state.activityLogs = [newLog, ...(state.activityLogs || [])];
        }

        const newBalance = safeBalance - totalRequired;
        
        let newTotalWagered = state.currentUser?.totalWagered || 0;
        let newVipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' = state.currentUser?.vipLevel || 'Bronze';
        if (state.currentUser) {
          if (state.currentUser.accountType === 'real') {
            newTotalWagered += totalRequired;
            newVipLevel = calculateVipLevel(newTotalWagered, state.currentUser.manualVipLevel) as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
            state.currentUser.totalWagered = newTotalWagered;
            state.currentUser.vipLevel = newVipLevel;
          }
        }

        const detailsStr = side === 'no'
          ? `Placed ₹${stake} Lay bet (Liability: ₹${potentialLiability.toFixed(2)}) on ${selection} @ ${odds.toFixed(2)} (${matchTitle})`
          : `Placed ₹${stake} Back bet on ${selection} @ ${odds.toFixed(2)} (${matchTitle})`;

        const tx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: 'trade',
          amount: totalRequired,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: detailsStr,
          status: 'Pending'
        };

        if (state.currentUser?.accountType === 'real') {
          recordGameRound({
            gameId: 'sportsbook',
            userId: state.currentUser.email,
            wager: totalRequired,
            payout: 0,
            multiplier: odds,
            won: false,
          });
        }

        const newTransactions = [tx, ...state.transactions];
        const syncedState = getSyncedStateAndSync(state, newBalance, newTransactions);

        // Achievement check logic for sports betting
        const toUnlock = new Set<string>();

        if (totalRequired >= 10000) toUnlock.add('high_roller');
        if (totalRequired === safeBalance) toUnlock.add('risk_taker');

        const currentHour = new Date().getHours();
        if (currentHour >= 0 && currentHour < 5) toUnlock.add('night_owl');
        if (currentHour >= 5 && currentHour < 8) toUnlock.add('early_bird');

        // Sports fanatic count
        const sportsBetsCount = newTransactions.filter(t => t.type === 'trade' && (t.details.includes('bet on') || t.details.includes('Back bet') || t.details.includes('Lay bet'))).length;
        if (sportsBetsCount >= 10) toUnlock.add('sports_fanatic');

        const totalWagersCount = newTransactions.filter(t => t.type === 'casino' || t.type === 'trade').length;
        if (totalWagersCount >= 100) toUnlock.add('centurion');
        if (newTotalWagered >= 100000) toUnlock.add('big_spender');

        if (newVipLevel !== 'Bronze') toUnlock.add('vip_ascension');

        let currentUnlocked = [...(state.unlockedAchievements || [])];
        let addedXp = 0;
        let addedPoints = 0;
        let latestUnlocked: any = null;

        for (const achId of toUnlock) {
          if (!currentUnlocked.includes(achId)) {
            currentUnlocked.push(achId);
            const ach = ACHIEVEMENTS.find((a) => a.id === achId);
            if (ach) {
              addedXp += ach.xpReward;
              addedPoints += ach.pointsReward;
              latestUnlocked = ach;
            }
          }
        }

        if (latestUnlocked && typeof window !== 'undefined') {
          setTimeout(() => {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              osc.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
              osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
              osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
              osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
              gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.5);
            } catch(e) {}
          }, 50);
        }

        const nextProcessed = uuid ? [...(state.processedUuids || []), uuid].slice(-200) : (state.processedUuids || []);

        return {
          ...syncedState,
          processedUuids: nextProcessed,
          activityLogs: state.activityLogs,
          unlockedAchievements: currentUnlocked,
          xp: (state.xp || 0) + addedXp,
          points: (state.points || 0) + addedPoints,
          latestAchievementUnlocked: latestUnlocked || state.latestAchievementUnlocked
        };
      }),

      cancelSportsBet: (transactionId) => set((state) => {
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }

        const txIndex = state.transactions.findIndex(t => t.id === transactionId && t.type === 'trade' && t.status === 'Pending');
        if (txIndex === -1) return state;

        const tx = state.transactions[txIndex];
        const newBalance = safeBalance + tx.amount;

        const updatedTx = {
          ...tx,
          status: 'Failed' as const,
          details: tx.details.replace('Placed', 'Cancelled')
        };

        const refundTx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: 'deposit',
          amount: tx.amount,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `Refunded ₹${tx.amount} (Bet Cancelled)`,
          status: 'Completed'
        };

        const newTransactions = [...state.transactions];
        newTransactions[txIndex] = updatedTx;
        newTransactions.unshift(refundTx);

        return getSyncedStateAndSync(state, newBalance, newTransactions);
      }),

      playCasino: (wager, payout, gameTitle, uuid) => set((state) => {
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }

        // Idempotency check
        if (uuid) {
          if (state.processedUuids && state.processedUuids.includes(uuid)) {
            console.warn(`[Idempotency Block] playCasino already processed for UUID: ${uuid}`);
            return state;
          }
        }

        // Check if this is a Live Casino game
        let isLiveCasino = false;
        const cleanTitle = gameTitle.replace(/\s*\(Wager\)|\s*\(Payout\)/i, '').trim().toLowerCase();
        
        // Find in GAMES registry
        const matchedGame = GAMES.find(g => 
          g.title.toLowerCase() === cleanTitle || 
          g.title.toLowerCase().includes(cleanTitle) || 
          cleanTitle.includes(g.title.toLowerCase()) ||
          g.id.toLowerCase() === cleanTitle
        );
        
        if (matchedGame && matchedGame.categories && matchedGame.categories.includes('live')) {
          isLiveCasino = true;
        }

        let commission = 0;
        if (isLiveCasino && wager > 0) {
          const vipLevel = state.currentUser?.vipLevel || 'Bronze';
          let feeRate = 0.03;
          if (vipLevel === 'Silver') feeRate = 0.02;
          else if (vipLevel === 'Gold') feeRate = 0.01;
          else if (vipLevel === 'Platinum') feeRate = 0.005;
          else if (vipLevel === 'Diamond') feeRate = 0.0;
          commission = Math.round(wager * feeRate * 100) / 100;
        }

        const totalDeduction = wager + commission;

        if (wager < 0 || payout < 0 || (wager === 0 && payout === 0)) {
          console.error("Invalid wager/payout parameters");
          return state;
        }

        if (totalDeduction > safeBalance) {
          console.error("Insufficient balance for wager and commission");
          return state;
        }

        const netChange = payout - totalDeduction;
        const newBalance = safeBalance + netChange;

        let newTotalWagered = state.currentUser?.totalWagered || 0;
        let newVipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' = state.currentUser?.vipLevel || 'Bronze';
        if (state.currentUser) {
          if (state.currentUser.accountType === 'real') {
            newTotalWagered += wager;
            newVipLevel = calculateVipLevel(newTotalWagered, state.currentUser.manualVipLevel) as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
            state.currentUser.totalWagered = newTotalWagered;
            state.currentUser.vipLevel = newVipLevel;
          }
        }

        const tx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: 'casino',
          amount: Math.abs(netChange),
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: commission > 0 
            ? `Played ${gameTitle} (Wager: ₹${wager} + ₹${commission.toFixed(2)} Live Fee, Payout: ₹${payout})`
            : `Played ${gameTitle} (Wager: ₹${wager}, Payout: ₹${payout})`,
          status: 'Completed'
        };

        const newTransactions = [tx, ...state.transactions];
        const syncedState = getSyncedStateAndSync(state, newBalance, newTransactions);

        // Achievement check logic
        const toUnlock = new Set<string>();
        toUnlock.add('first_spin');

        if (wager >= 10000) toUnlock.add('high_roller');
        if (payout >= 50000) toUnlock.add('half_century');
        if (wager === safeBalance) toUnlock.add('risk_taker');
        if (payout >= wager * 100) toUnlock.add('jackpot_hunter');
        if (payout >= wager * 10) toUnlock.add('lucky_break');

        const currentHour = new Date().getHours();
        if (currentHour >= 0 && currentHour < 5) toUnlock.add('night_owl');
        if (currentHour >= 5 && currentHour < 8) toUnlock.add('early_bird');

        const totalWagersCount = newTransactions.filter(t => t.type === 'casino' || t.type === 'trade').length;
        if (totalWagersCount >= 100) toUnlock.add('centurion');
        if (newTotalWagered >= 100000) toUnlock.add('big_spender');
        if (newBalance >= 500000) toUnlock.add('wealthy_investor');

        // Streak check
        const won = payout > wager;
        let newStreak = state.winStreakCount || 0;
        if (won) {
          newStreak += 1;
          if (newStreak >= 5) toUnlock.add('hot_streak');
        } else if (payout === 0) {
          newStreak = 0;
        }

        if (newVipLevel !== 'Bronze') toUnlock.add('vip_ascension');

        let currentUnlocked = [...(state.unlockedAchievements || [])];
        let addedXp = 0;
        let addedPoints = 0;
        let latestUnlocked: any = null;

        for (const achId of toUnlock) {
          if (!currentUnlocked.includes(achId)) {
            currentUnlocked.push(achId);
            const ach = ACHIEVEMENTS.find((a) => a.id === achId);
            if (ach) {
              addedXp += ach.xpReward;
              addedPoints += ach.pointsReward;
              latestUnlocked = ach;
            }
          }
        }

        if (latestUnlocked && typeof window !== 'undefined') {
          setTimeout(() => {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              osc.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
              osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
              osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
              osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
              gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.5);
            } catch(e) {}
          }, 50);
        }

        const nextProcessed = uuid ? [...(state.processedUuids || []), uuid].slice(-200) : (state.processedUuids || []);

        return {
          ...syncedState,
          processedUuids: nextProcessed,
          winStreakCount: newStreak,
          unlockedAchievements: currentUnlocked,
          xp: (state.xp || 0) + addedXp,
          points: (state.points || 0) + addedPoints,
          latestAchievementUnlocked: latestUnlocked || state.latestAchievementUnlocked,
          latestWinCelebration: payout >= 500 ? { amount: payout, gameTitle } : state.latestWinCelebration
        };
      }),

      cashOut: (positionId, currentMarketPrice) => set((state) => {
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }

        const position = state.positions.find(p => p.id === positionId);
        if (!position) return state; // Ensure position exists

        const currentValue = position.shares * (currentMarketPrice / 100);
        const newBalance = safeBalance + currentValue;

        // Security check: Remove the position to prevent infinite cashouts
        const updatedPositions = state.positions.filter(p => p.id !== positionId);

        const tx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: 'cashout',
          amount: currentValue,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `Cashed out ${position.shares.toFixed(1)} shares of ${position.marketTitle} at ${currentMarketPrice}%`,
          status: 'Completed'
        };

        if (state.currentUser?.accountType === 'real') {
          recordGameRound({
            gameId: 'predictions_cashout',
            userId: state.currentUser.email,
            wager: position.investment,
            payout: currentValue,
            multiplier: currentValue / position.investment,
            won: currentValue > position.investment,
          });
        }

        const newTransactions = [tx, ...state.transactions];
        const syncedState = getSyncedStateAndSync(state, newBalance, newTransactions, updatedPositions);

        // Achievement check logic for predictions
        const toUnlock = new Set<string>();

        // 1. Diamond Hands: held for 24+ hours
        const holdTime = Date.now() - position.timestamp;
        if (holdTime >= 24 * 60 * 60 * 1000) {
          toUnlock.add('diamond_hands');
        }

        // 2. Sharpshooter prediction win streak
        const won = currentValue > position.investment;
        let newStreak = state.predictionWinStreak || 0;
        if (won) {
          newStreak += 1;
          if (newStreak >= 3) toUnlock.add('sharpshooter');
        } else {
          newStreak = 0;
        }

        if (currentValue >= 50000) toUnlock.add('half_century');

        let currentUnlocked = [...(state.unlockedAchievements || [])];
        let addedXp = 0;
        let addedPoints = 0;
        let latestUnlocked: any = null;

        for (const achId of toUnlock) {
          if (!currentUnlocked.includes(achId)) {
            currentUnlocked.push(achId);
            const ach = ACHIEVEMENTS.find((a) => a.id === achId);
            if (ach) {
              addedXp += ach.xpReward;
              addedPoints += ach.pointsReward;
              latestUnlocked = ach;
            }
          }
        }

        if (latestUnlocked && typeof window !== 'undefined') {
          setTimeout(() => {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              osc.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
              osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
              osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
              osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
              gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.5);
            } catch(e) {}
          }, 50);
        }

        return {
          ...syncedState,
          predictionWinStreak: newStreak,
          unlockedAchievements: currentUnlocked,
          xp: (state.xp || 0) + addedXp,
          points: (state.points || 0) + addedPoints,
          latestAchievementUnlocked: latestUnlocked || state.latestAchievementUnlocked
        };
      }),

      repairState: () => set((state) => {
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }
        
        const safeTransactions = Array.isArray(state.transactions)
          ? state.transactions.filter(tx => tx && typeof tx.amount === 'number' && !isNaN(tx.amount))
          : [];
        const safePositions = Array.isArray(state.positions) ? state.positions : [];
        
        // Timezone-aware streak check
        const streakResult = checkStreak(state.lastLoginDate, state.streakCount || 0);
        let claimed = state.claimedToday;
        let spinClaimed = state.spinWheelClaimedToday;
        let streak = state.streakCount || 0;

        if (streakResult.status === 'already_claimed') {
          claimed = true;
          streak = streakResult.newStreak;
        } else if (streakResult.status === 'claim_available') {
          claimed = false;
          spinClaimed = false; // Reset spin too on a new day
          streak = streakResult.newStreak;
        } else if (streakResult.status === 'streak_broken') {
          claimed = false;
          spinClaimed = false;
          streak = 1;
        }

        const synced = getSyncedStateAndSync(state, safeBalance, safeTransactions, safePositions);
        return {
          ...synced,
          streakCount: streak,
          claimedToday: claimed,
          spinWheelClaimedToday: spinClaimed
        };
      }),

      checkDailyStreak: () => {
        set((state) => {
          const streakResult = checkStreak(state.lastLoginDate, state.streakCount || 0);
          let claimed = state.claimedToday;
          let spinClaimed = state.spinWheelClaimedToday;
          let streak = state.streakCount || 0;

          if (streakResult.status === 'already_claimed') {
            claimed = true;
            streak = streakResult.newStreak;
          } else if (streakResult.status === 'claim_available') {
            claimed = false;
            spinClaimed = false;
            streak = streakResult.newStreak;
          } else if (streakResult.status === 'streak_broken') {
            claimed = false;
            spinClaimed = false;
            streak = 1;
          }
          return {
            streakCount: streak,
            claimedToday: claimed,
            spinWheelClaimedToday: spinClaimed
          };
        });
      },

      claimDailyReward: () => {
        const state = get();
        if (state.claimedToday) return;

        const DAILY_REWARDS = [50, 100, 200, 350, 500, 1000, 5000];
        const currentStreak = state.streakCount || 1;
        const dayIndex = Math.min(6, Math.max(0, currentStreak - 1));
        const rewardAmount = DAILY_REWARDS[dayIndex] || 50;

        const newBalance = state.balance + rewardAmount;
        const todayStr = new Date().toISOString().split('T')[0];

        const tx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: 'deposit',
          amount: rewardAmount,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `Claimed Daily Reward (Day ${currentStreak} Streak)`,
          status: 'Completed'
        };

        const newTransactions = [tx, ...state.transactions];
        const syncedState = getSyncedStateAndSync(state, newBalance, newTransactions);

        set({
          ...syncedState,
          claimedToday: true,
          lastLoginDate: todayStr
        });

        // Trigger steady earner check
        if (currentStreak >= 5) {
          get().unlockAchievement('steady_earner');
        }
      },

      spinWheelClaimed: (prizeAmount, prizeName) => {
        const state = get();
        if (state.spinWheelClaimedToday) return;

        let newBalance = state.balance;
        let details = `Spin the Wheel: ${prizeName}`;

        if (prizeAmount > 0) {
          newBalance += prizeAmount;
        }

        const tx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: 'deposit',
          amount: prizeAmount,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details,
          status: 'Completed'
        };

        const newTransactions = [tx, ...state.transactions];
        const syncedState = getSyncedStateAndSync(state, newBalance, newTransactions);

        set({
          ...syncedState,
          spinWheelClaimedToday: true
        });
      },

      unlockAchievement: (id) => {
        const state = get();
        if (state.unlockedAchievements?.includes(id)) return;

        const ach = ACHIEVEMENTS.find((a) => a.id === id);
        if (!ach) return;

        const newUnlocked = [...(state.unlockedAchievements || []), id];
        const newXp = (state.xp || 0) + ach.xpReward;
        const newPoints = (state.points || 0) + ach.pointsReward;

        set({
          unlockedAchievements: newUnlocked,
          xp: newXp,
          points: newPoints,
          latestAchievementUnlocked: ach
        });

        // Auto unlock aura legend if they reach 10 achievements
        if (newUnlocked.length >= 10 && !newUnlocked.includes('aura_legend')) {
          setTimeout(() => {
            get().unlockAchievement('aura_legend');
          }, 3000);
        }

        // Web Audio chime
        try {
          if (typeof window !== 'undefined') {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
            osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
            
            gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
          }
        } catch (e) {
          console.error("Audio achievement chime error:", e);
        }
      },

      clearLatestAchievement: () => set({ latestAchievementUnlocked: null }),

      clearLatestWinCelebration: () => set({ latestWinCelebration: null }),

      fetchSystemConfig: async () => {
        try {
          const res = await fetch('/api/system-config');
          if (res.ok) {
            const data = await res.json();
            if (data.success && typeof data.houseEdge === 'number') {
              set({ houseEdge: data.houseEdge });
            }
          }
        } catch (err) {
          console.error("Failed to fetch system config in store:", err);
        }
      },

      setKycStatus: (status) => set((state) => {
        if (status === 'VERIFIED') {
          if (!state.kycSubmittedAt) {
            console.error("KYC violation: No active document review submission found.");
            return state;
          }
          const elapsed = Date.now() - state.kycSubmittedAt;
          if (elapsed < 10 * 60 * 1000 - 5000) {
            console.error("KYC violation: Document verification is still pending automatic review.");
            return state;
          }
        }

        if (state.currentUser) {
          const updatedUser = { ...state.currentUser, kycStatus: status };
          if (status === 'VERIFIED') {
            updatedUser.kycSubmittedAt = null;
          }
          // Sync with database
          fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: updatedUser.email,
              kycStatus: status
            })
          }).catch(err => console.error("Sync failed", err));
          
          return { 
            kycStatus: status, 
            currentUser: updatedUser,
            kycSubmittedAt: status === 'VERIFIED' ? null : state.kycSubmittedAt
          };
        }
        return { 
          kycStatus: status,
          kycSubmittedAt: status === 'VERIFIED' ? null : state.kycSubmittedAt
        };
      }),
      setKycSubmittedAt: (time) => set((state) => {
        if (state.currentUser) {
          const updatedUser = { ...state.currentUser, kycSubmittedAt: time };
          return { kycSubmittedAt: time, currentUser: updatedUser };
        }
        return { kycSubmittedAt: time };
      }),
      setGeoRestricted: (restricted) => set((state) => {
        if (state.currentUser) {
          const updatedUser = { ...state.currentUser, geoRestricted: restricted };
          return { geoRestricted: restricted, currentUser: updatedUser };
        }
        return { geoRestricted: restricted };
      }),
      setVerifiedAge: (age) => set((state) => {
        if (state.currentUser) {
          const updatedUser = { ...state.currentUser, verifiedAge: age };
          return { verifiedAge: age, currentUser: updatedUser };
        }
        return { verifiedAge: age };
      }),
      fetchActivityLogs: async () => {
        const state = get();
        if (!state.isLoggedIn || !state.currentUser) return;
        try {
          const res = await fetch('/api/account/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: state.currentUser.email })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            set({ activityLogs: data.logs || [] });
          }
        } catch (err) {
          console.error("Failed to fetch activity logs:", err);
        }
      },
      dismissDailyModal: () => {
        const todayStr = new Date().toISOString().split('T')[0];
        set({ dailyModalLastDismissedDate: todayStr });
      }
    }),
    {
      name: 'AuraBet-trading-storage', // key in localStorage
    }
  )
);
