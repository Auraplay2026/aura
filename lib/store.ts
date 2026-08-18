import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recordGameRound } from './recordRound';
import { ACHIEVEMENTS } from './achievements';
import { checkStreak } from './streakEngine';
import { GAMES } from './games';
export interface GameSessionStats {
  wagers: number[];
  payouts: number[];
  multipliers: number[];
  timestamps: number[];
}

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
  
  totalWagered?: number;
  vipLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  manualVipLevel?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | null;
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
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  sfxVolume: number;
  setSfxVolume: (vol: number) => void;
  ambientEnabled: boolean;
  setAmbientEnabled: (enabled: boolean) => void;
  ambientPreset: 'default' | 'tension' | 'cyber';
  setAmbientPreset: (preset: 'default' | 'tension' | 'cyber') => void;
  sessionStats: Record<string, GameSessionStats>;
  recordSessionRound: (gameId: string, wager: number, payout: number, multiplier: number) => void;

  // Actions
  deposit: (amount: number, method?: string) => Promise<void>;
  placeTrade: (marketId: string, marketTitle: string, side: 'yes' | 'no', investment: number, currentPrice: number, uuid?: string) => Promise<void>;
  cashOut: (positionId: string, currentMarketPrice: number) => Promise<void>;
  repairState: () => void;
  syncFromServer: () => Promise<void>;
  
  // Auth Actions
  login: () => Promise<void>;
  logout: () => void;
  signUp: (username: string, email: string, passwordHash: string, accountType?: 'demo' | 'real', referralCode?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (emailOrUsername: string, passwordHash: string, otp?: string, captcha?: string) => Promise<{ success: boolean; error?: string; twoFactorRequired?: boolean }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  setup2fa: () => Promise<{ success: boolean; secret?: string; keyUri?: string; error?: string }>;
  verifyAndEnable2fa: (token: string, secret: string) => Promise<{ success: boolean; error?: string }>;
  disable2fa: (token: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, username: string, idToken?: string) => Promise<{ success: boolean; error?: string }>;
  switchAccountType: (type: 'demo' | 'real') => Promise<void>;
  completeOnboarding: (phoneNumber?: string, gamingState?: string, upiId?: string) => Promise<void>;
  updateProfile: (updates: { username?: string; phoneNumber?: string; upiId?: string; gamingState?: string; fullName?: string; dob?: string; address?: string; twoFactorEnabled?: boolean; notifications?: { id: string; message: string; timestamp: number; read: boolean; title?: string }[] }) => Promise<boolean>;
  setKycStatus: (status: 'UNVERIFIED' | 'PROCESSING' | 'VERIFIED' | 'REJECTED') => void;
  setKycSubmittedAt: (time: number | null) => void;
  setGeoRestricted: (restricted: boolean) => void;
  setVerifiedAge: (age: number) => void;
  fetchActivityLogs: () => Promise<void>;

  // Sportsbook
  placeSportsBet: (matchTitle: string, selection: string, odds: number, stake: number, side?: 'yes' | 'no', uuid?: string) => Promise<any>;
  cancelSportsBet: (transactionId: string) => Promise<void>;

  // Casino
  playCasino: (wager: number, payout: number, gameTitle: string, uuid?: string) => void;
  houseEdge: number;
  demoWinRate: number;
  realWinRate: number;
  fetchSystemConfig: () => Promise<void>;

  // Daily Streak & Spin Actions
  checkDailyStreak: () => void;
  fetchStreakStatus: () => Promise<void>;
  claimDailyReward: () => Promise<void>;
  spinWheelClaimed: (prizeAmount: number, prizeName: string, prizeIndex?: number) => Promise<void>;
  unlockAchievement: (id: string) => void;
  clearLatestAchievement: () => void;
  clearLatestWinCelebration: () => void;
  dismissDailyModal: () => void;
}

export function calculateVipLevel(wagered: number, manualLevel?: string | null) {
  if (manualLevel && manualLevel !== 'Auto') return manualLevel;
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
  hasCompletedOnboarding?: boolean,
  phoneNumber?: string,
  gamingState?: string,
  upiId?: string,
  totalWagered?: number,
  vipLevel?: string,
  manualVipLevel?: string | null,
  vipRewardsClaimed?: Record<string, boolean>
) {
  fetch('/api/auth/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email: email || '', 
      accountType, 
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
      state.currentUser.email || state.currentUser.username, 
      accountType, 
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
      ? { 
          ...state.currentUser, 
          balance: roundedBalance, 
          transactions: newTransactions, 
          positions: positionsToUse,
          ...(state.currentUser.accountType === 'real'
            ? { realBalance: roundedBalance, realTransactions: newTransactions, realPositions: positionsToUse }
            : { demoBalance: roundedBalance, demoTransactions: newTransactions, demoPositions: positionsToUse })
        }
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
  const accountType = user.accountType === 'real' ? 'real' : 'demo';
  const realBalance = coerce(user.realBalance);
  const demoBalance = coerce(user.demoBalance);
  return {
    ...user,
    balance: coerce(accountType === 'real' ? realBalance : demoBalance),
    demoBalance,
    realBalance,
    totalWagered: coerce(user.totalWagered),
    affiliateEarnings: coerce(user.affiliateEarnings),
  };
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get): TradingState => ({
      balance: 100000, // Start with ₹100,000 Trading Power
      positions: [] as Position[],
      transactions: [] as Transaction[],
      currentUser: null as UserProfile | null,
      isLoggedIn: false, // Default to logged out
      kycStatus: 'UNVERIFIED',
      geoRestricted: false,
      verifiedAge: 0,
      activityLogs: [] as any[],
      kycSubmittedAt: null as number | null,
      processedUuids: [] as string[],
      houseEdge: 2.0, // Default 2% house edge
      demoWinRate: 80,
      realWinRate: 30,

      // Daily Streak & Spin states
      streakCount: 0,
      lastLoginDate: null as string | null,
      claimedToday: false,
      spinWheelClaimedToday: false,
      dailyModalLastDismissedDate: null as string | null,

      // Achievements states
      unlockedAchievements: [] as string[],
      xp: 0,
      points: 0,
      latestAchievementUnlocked: null as any | null,
      winStreakCount: 0,
      predictionWinStreak: 0,
      latestWinCelebration: null as { amount: number; gameTitle: string } | null,
      soundEnabled: true,
      setSoundEnabled: (enabled) => {
        set({ soundEnabled: enabled });
        try {
          const { startAmbientMusic, stopAmbientMusic } = require('./audio');
          if (enabled && get().ambientEnabled) {
            startAmbientMusic();
          } else {
            stopAmbientMusic();
          }
        } catch (e) {}
      },
      sfxVolume: 50,
      setSfxVolume: (vol) => set({ sfxVolume: vol }),
      ambientEnabled: true,
      setAmbientEnabled: (enabled) => {
        set({ ambientEnabled: enabled });
        try {
          const { startAmbientMusic, stopAmbientMusic } = require('./audio');
          if (enabled && get().soundEnabled) {
            startAmbientMusic(get().ambientPreset);
          } else {
            stopAmbientMusic();
          }
        } catch (e) {}
      },
      ambientPreset: 'default',
      setAmbientPreset: (preset) => {
        set({ ambientPreset: preset });
        try {
          const { startAmbientMusic, stopAmbientMusic } = require('./audio');
          if (get().ambientEnabled && get().soundEnabled) {
            startAmbientMusic(preset);
          }
        } catch (e) {}
      },
      sessionStats: {} as Record<string, GameSessionStats>,
      recordSessionRound: (gameId, wager, payout, multiplier) => {
        set((state) => {
          const stats = state.sessionStats || {};
          const gameStats = stats[gameId] || { wagers: [], payouts: [], multipliers: [], timestamps: [] };
          const newGameStats = {
            wagers: [...gameStats.wagers, wager].slice(-50),
            payouts: [...gameStats.payouts, payout].slice(-50),
            multipliers: [...gameStats.multipliers, multiplier].slice(-50),
            timestamps: [...gameStats.timestamps, Date.now()].slice(-50),
          };
          return {
            sessionStats: {
              ...stats,
              [gameId]: newGameStats
            }
          };
        });
      },

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
          const userIdentifier = state.currentUser.email || state.currentUser.username;
          const res = await fetch('/api/auth/me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userIdentifier })
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
              ...(data.streak ? {
                streakCount: data.streak.currentStreak,
                claimedToday: data.streak.streakClaimedToday,
                spinWheelClaimedToday: data.streak.spinClaimedToday,
                lastLoginDate: data.streak.todayDate
              } : {})
            });
          }
        } catch (err) {
          console.error("Failed to sync from server", err);
        }
      },

      logout: () => {
        // 1. Clear server-side httpOnly auth cookies
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        // 2. Clear client-side state
        set({
          isLoggedIn: false,
          currentUser: null,
          balance: 100000,
          positions: [],
          transactions: []
        });
        // 3. Clear persisted Zustand storage to prevent stale session on reload
        if (typeof window !== 'undefined') {
          try { 
            localStorage.removeItem('AuraBet-trading-storage'); 
            localStorage.removeItem('AuraBet-trading-storage-v2');
          } catch {}
          (window as any).__AURA_AUTH_DEBUG__ = { event: 'logout', ts: Date.now() };
        }
      },

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

      loginWithCredentials: async (emailOrUsername, password, otp, captcha) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrUsername, password, otp, captcha })
          });
          const data = await res.json();
          if (data && data.twoFactorRequired) {
            return { success: false, twoFactorRequired: true };
          }
          if (!res.ok) {
            return { success: false, error: data.error || "Login failed." };
          }
          
          const sanitizedUser = sanitizeClientUserProfile(data.user);
          const nextState = {
            currentUser: sanitizedUser,
            isLoggedIn: true,
            balance: sanitizedUser ? sanitizedUser.balance : 0,
            positions: data.user.positions,
            transactions: data.user.transactions,
            kycStatus: mapKycStatus(sanitizedUser?.kycStatus),
            geoRestricted: sanitizedUser?.geoRestricted || false,
            verifiedAge: sanitizedUser?.verifiedAge || 0,
          };
          set(nextState);
          if (typeof window !== 'undefined') {
            (window as any).__AURA_AUTH_DEBUG__ = { event: 'store-login-success', payload: nextState, ts: Date.now() };
          }
          return { success: true };
        } catch (err) {
          if (typeof window !== 'undefined') {
            (window as any).__AURA_AUTH_DEBUG__ = { event: 'store-login-error', payload: err, ts: Date.now() };
          }
          return { success: false, error: "Network error. Please try again." };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        const currentUser = get().currentUser;
        if (!currentUser) return { success: false, error: "Not logged in." };
        try {
          const userIdentifier = currentUser.email || currentUser.username;
          const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userIdentifier, currentPassword, newPassword })
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
          const userIdentifier = currentUser.email || currentUser.username;
          const res = await fetch('/api/auth/2fa/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userIdentifier })
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
          const userIdentifier = currentUser.email || currentUser.username;
          const res = await fetch('/api/auth/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userIdentifier, token, secret, enable: true })
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
          const userIdentifier = currentUser.email || currentUser.username;
          const res = await fetch('/api/auth/2fa/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userIdentifier, token, enable: false })
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

      loginWithGoogle: async (email, username, idToken) => {
        try {
          const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name: username, idToken })
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

      deposit: async (amount, method = 'UPI') => {
        const state = useTradingStore.getState();
        if (!state.isLoggedIn || !state.currentUser) return;

        let rewardType = 'cashier_deposit';
        if (amount < 0) {
          rewardType = 'cashier_withdraw';
        } else if (method === 'Daily Bonus Drop') {
          rewardType = 'daily';
        } else if (method === 'Weekly VIP Drop') {
          rewardType = 'weekly';
        } else if (method === 'Monthly Super Drop') {
          rewardType = 'monthly';
        } else if (method === 'Instant Rakeback') {
          rewardType = 'rakeback';
        } else if (method === 'AURA VIP Drop') {
          rewardType = 'concierge';
        }

        try {
          const userIdentifier = state.currentUser.email || state.currentUser.username;
          const res = await fetch('/api/rewards/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userIdentifier,
              rewardType,
              amount: Math.abs(amount),
              details: method
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            await state.syncFromServer();
          } else {
            console.error(data.error || "Failed to process deposit/withdrawal on server");
          }
        } catch (err) {
          console.error("Failed to process deposit/withdrawal", err);
        }
      },

      placeTrade: async (marketId, marketTitle, side, investment, currentPrice, uuid) => {
        const state = useTradingStore.getState();
        if (!state.isLoggedIn || !state.currentUser) return;

        // Idempotency check
        if (uuid) {
          if (state.processedUuids && state.processedUuids.includes(uuid)) {
            console.warn(`[Idempotency Block] placeTrade already processed for UUID: ${uuid}`);
            return;
          }
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
          set({ activityLogs: [newLog, ...(state.activityLogs || [])] });
        }

        try {
          const userIdentifier = state.currentUser.email || state.currentUser.username;
          const res = await fetch('/api/predictions/trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userIdentifier,
              marketId,
              marketTitle,
              side,
              investment,
              currentPrice
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            await state.syncFromServer();
            
            if (state.currentUser?.accountType === 'real') {
              recordGameRound({
                gameId: 'predictions',
                userId: userIdentifier,
                wager: investment,
                payout: 0,
                multiplier: 0,
                won: false,
              });
            }

            const nextProcessed = uuid ? [...(state.processedUuids || []), uuid].slice(-200) : (state.processedUuids || []);
            set({ processedUuids: nextProcessed });
          } else {
            console.error(data.error || "Failed to place trade on server");
          }
        } catch (err) {
          console.error("Failed to place trade", err);
        }
      },

      placeSportsBet: async (matchTitle, selection, odds, stake, side = 'yes', uuid) => {
        const state = useTradingStore.getState();
        if (!state.isLoggedIn || !state.currentUser) {
          return { success: false, error: 'Please log in to place a bet.' };
        }

        try {
          const userEmail = state.currentUser.email || state.currentUser.username;
          const res = await fetch('/api/sports/bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userEmail,
              matchTitle,
              selection,
              odds: Number(odds),
              stake: Number(stake),
              side: side || 'yes',
              uuid: uuid || `BET-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            // Instant Client-side Store Append for 0-latency UI responsiveness
            const newPos: Position = data.position || {
              id: data.transactionId || `POS-${Date.now()}`,
              marketId: `SPORT-${(matchTitle || 'MATCH').replace(/[^a-zA-Z0-9]/g, '-').toUpperCase()}`,
              marketTitle: `[LOCKED] ${matchTitle}: ${selection} (${Number(odds).toFixed(2)})`,
              side: side || 'yes',
              shares: side === 'no' ? Number(stake) : Math.round(Number(stake) * Number(odds) * 100) / 100,
              buyPrice: Number(odds),
              investment: side === 'no' ? Number(stake) * Number(odds) : Number(stake),
              timestamp: Date.now()
            };

            const chargedAmount = typeof data.totalCharged === 'number' ? data.totalCharged : Number(stake);
            const newTx: Transaction = data.tx || {
              id: data.transactionId || `TX-${Date.now()}`,
              type: 'trade',
              amount: chargedAmount,
              balanceAfter: typeof data.newBalance === 'number' ? data.newBalance : Math.round((state.balance - chargedAmount) * 100) / 100,
              timestamp: Date.now(),
              details: `[LOCKED] Placed ₹${stake} ${side === 'no' ? 'Lay' : 'Back'} bet on ${selection} @ ${Number(odds).toFixed(2)} (${matchTitle}) [Includes 15% Platform Fee: ₹${(Number(stake) * 0.15).toFixed(2)}]`,
              status: 'Locked' as any
            };

            const updatedPositions = [newPos, ...state.positions];
            const updatedTransactions = [newTx, ...state.transactions];
            const updatedBalance = typeof data.newBalance === 'number' ? data.newBalance : Math.round((state.balance - chargedAmount) * 100) / 100;

            const isReal = state.currentUser.accountType === 'real';
            const updatedUser: UserProfile = {
              ...state.currentUser,
              balance: updatedBalance,
              positions: updatedPositions,
              transactions: updatedTransactions,
              ...(isReal
                ? {
                    realBalance: updatedBalance,
                    realPositions: updatedPositions,
                    realTransactions: updatedTransactions,
                    totalWagered: (state.currentUser.totalWagered || 0) + Number(stake)
                  }
                : {
                    demoBalance: updatedBalance,
                    demoPositions: updatedPositions,
                    demoTransactions: updatedTransactions
                  })
            };

            set({
              balance: updatedBalance,
              positions: updatedPositions,
              transactions: updatedTransactions,
              currentUser: updatedUser
            });

            // Async background sync
            state.syncFromServer().catch(() => {});

            return {
              success: true,
              transactionId: data.transactionId,
              newBalance: updatedBalance,
              position: newPos,
              tx: newTx,
              isLocked: true
            };
          } else {
            console.error(data.error || "Failed to place sports bet.");
            return {
              success: false,
              error: data.error || 'Failed to place sports wager.'
            };
          }
        } catch (err: any) {
          console.error("Failed to place sports bet", err);
          return {
            success: false,
            error: err?.message || 'Network communication error.'
          };
        }
      },

      cancelSportsBet: async (transactionId: string) => {
        console.warn("[IMMUTABLE_BET_POLICY] Accepted bets are locked and frozen until official match conclusion. Cancellation is prohibited.");
      },

      playCasino: (wager: number, payout: number, gameTitle: string, uuid?: string) => {
        const state = useTradingStore.getState();
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }

        // Idempotency check
        if (uuid) {
          if (state.processedUuids && state.processedUuids.includes(uuid)) {
            console.warn(`[Idempotency Block] playCasino already processed for UUID: ${uuid}`);
            return;
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
          return;
        }

        if (totalDeduction > safeBalance && wager > 0) {
          console.error("Insufficient balance for wager and commission");
          return;
        }

        const netChange = payout - totalDeduction;
        const newBalance = Math.max(0, Math.round((safeBalance + netChange) * 100) / 100);

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

        const txId = uuid || `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const tx: Transaction = {
          id: txId,
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

        // Persist to PostgreSQL database atomically so losses/gains are permanently stored
        if (state.isLoggedIn && state.currentUser) {
          const userIdentifier = state.currentUser.email || state.currentUser.username;
          fetch('/api/casino/record-wager', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userIdentifier,
              wager,
              payout,
              gameTitle,
              commission,
              uuid: txId
            })
          }).catch(err => console.error("Failed to persist casino wager to PostgreSQL database", err));
        }

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
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
              gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.5);
            } catch (e) {}
          }, 100);
        }

        const nextProcessed = uuid ? [...(state.processedUuids || []), uuid].slice(-200) : (state.processedUuids || []);

        set({
          ...syncedState,
          processedUuids: nextProcessed,
          winStreakCount: newStreak,
          unlockedAchievements: currentUnlocked,
          xp: (state.xp || 0) + addedXp,
          points: (state.points || 0) + addedPoints,
          latestAchievementUnlocked: latestUnlocked || state.latestAchievementUnlocked,
          latestWinCelebration: payout >= 500 ? { amount: payout, gameTitle } : state.latestWinCelebration
        });
      },

      cashOut: async (positionId: string, currentMarketPrice?: number) => {
        const state = useTradingStore.getState();
        if (!state.isLoggedIn || !state.currentUser) return;

        const userIdentifier = state.currentUser.email || state.currentUser.username;
        const position = state.positions.find(p => p.id === positionId);

        // 1. If this is a sports exchange position
        if (position && (position.marketId.startsWith('SPORT-') || position.marketTitle.includes(':'))) {
          try {
            const currentOdds = typeof currentMarketPrice === 'number' && currentMarketPrice > 0 ? currentMarketPrice : position.buyPrice;
            const res = await fetch('/api/sports/cashout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userIdentifier,
                positionId: position.id,
                transactionId: position.id,
                currentOdds
              })
            });
            const data = await res.json();
            if (res.ok && data.success) {
              await state.syncFromServer();
              return;
            } else {
              // Fallback to sports cancel if odds calculate flat
              const cancelRes = await fetch('/api/sports/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: userIdentifier,
                  positionId: position.id,
                  transactionId: position.id
                })
              });
              const cancelData = await cancelRes.json();
              if (cancelRes.ok && cancelData.success) {
                await state.syncFromServer();
                return;
              }
              alert(data.error || cancelData.error || "Failed to cash out sports position.");
              return;
            }
          } catch (err) {
            console.error("Failed to cash out sports bet", err);
            return;
          }
        }

        // 2. If position not in positions list, check pending transactions
        if (!position) {
          const pendingTx = state.transactions.find(t => t.id === positionId && t.status === 'Pending');
          if (pendingTx) {
            await state.cancelSportsBet(positionId);
            return;
          }
          return;
        }

        // 3. Binary Prediction Cashout
        try {
          const parsedPrice = typeof currentMarketPrice === 'number' ? currentMarketPrice : 50;
          const res = await fetch('/api/predictions/cashout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userIdentifier,
              positionId,
              currentMarketPrice: parsedPrice
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            await state.syncFromServer();

            const currentValue = position.shares * (parsedPrice / 100);

            if (state.currentUser?.accountType === 'real') {
              recordGameRound({
                gameId: 'predictions_cashout',
                userId: userIdentifier,
                wager: position.investment,
                payout: currentValue,
                multiplier: currentValue / position.investment,
                won: currentValue > position.investment,
              });
            }

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

            if (latestUnlocked && typeof window !== 'undefined' && state.soundEnabled !== false) {
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

            set({
              predictionWinStreak: newStreak,
              unlockedAchievements: currentUnlocked,
              xp: (state.xp || 0) + addedXp,
              points: (state.points || 0) + addedPoints,
              latestAchievementUnlocked: latestUnlocked || state.latestAchievementUnlocked
            });
          } else {
            console.error(data.error || "Failed to cash out on server");
          }
        } catch (err) {
          console.error("Failed to cash out", err);
        }
      },

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
        get().fetchStreakStatus();
      },

      fetchStreakStatus: async () => {
        const state = get();
        if (!state.isLoggedIn || !state.currentUser) return;
        try {
          const userIdentifier = state.currentUser.email || state.currentUser.username;
          const res = await fetch('/api/streak/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userIdentifier })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            set({
              streakCount: data.currentStreak,
              claimedToday: data.streakClaimedToday,
              spinWheelClaimedToday: data.spinClaimedToday,
              lastLoginDate: data.todayDate
            });
          }
        } catch (err) {
          console.error("Failed to fetch streak status:", err);
        }
      },

      claimDailyReward: async () => {
        const state = get();
        if (state.claimedToday || !state.isLoggedIn || !state.currentUser) return;

        try {
          const userIdentifier = state.currentUser.email || state.currentUser.username;
          const res = await fetch('/api/streak/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userIdentifier })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            set({
              claimedToday: true,
              streakCount: data.day || state.streakCount,
            });
            await state.syncFromServer();
            if ((data.day || state.streakCount) >= 5) {
              get().unlockAchievement('steady_earner');
            }
          } else {
            console.error(data.error || "Failed to claim daily streak reward on server");
          }
        } catch (err) {
          console.error("Failed to claim daily reward", err);
        }
      },

      spinWheelClaimed: async (prizeAmount: number, prizeName: string, prizeIndex?: number) => {
        const state = get();
        if (state.spinWheelClaimedToday || !state.isLoggedIn || !state.currentUser) return;

        try {
          const userIdentifier = state.currentUser.email || state.currentUser.username;
          const pIndex = prizeIndex !== undefined ? prizeIndex : 0;
          const res = await fetch('/api/streak/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userIdentifier,
              prizeIndex: pIndex
            })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            set({
              spinWheelClaimedToday: true
            });
            await state.syncFromServer();
          } else {
            console.error(data.error || "Failed to claim spin wheel reward on server");
          }
        } catch (err) {
          console.error("Failed to claim spin wheel reward", err);
        }
      },

      unlockAchievement: (id: string) => {
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
              set({ 
                houseEdge: data.houseEdge,
                demoWinRate: data.demoWinRate ?? 80,
                realWinRate: data.realWinRate ?? 30
              });
            }
          }
        } catch (err) {
          console.error("Failed to fetch system config in store:", err);
        }
      },

      setKycStatus: (status: 'UNVERIFIED' | 'PROCESSING' | 'VERIFIED' | 'REJECTED') => set((state) => {
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
      setKycSubmittedAt: (time: number | null) => set((state) => {
        if (state.currentUser) {
          const updatedUser = { ...state.currentUser, kycSubmittedAt: time };
          return { kycSubmittedAt: time, currentUser: updatedUser };
        }
        return { kycSubmittedAt: time };
      }),
      setGeoRestricted: (restricted: boolean) => set((state) => {
        if (state.currentUser) {
          const updatedUser = { ...state.currentUser, geoRestricted: restricted };
          return { geoRestricted: restricted, currentUser: updatedUser };
        }
        return { geoRestricted: restricted };
      }),
      setVerifiedAge: (age: number) => set((state) => {
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
          const userIdentifier = state.currentUser.email || state.currentUser.username;
          const res = await fetch('/api/account/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userIdentifier })
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
      name: 'AuraBet-trading-storage-v2',
      version: 2,
      partialize: (state) => ({
        currentUser: state.currentUser ? {
          ...state.currentUser,
          transactions: [],
          positions: [],
          demoTransactions: [],
          demoPositions: [],
          realTransactions: [],
          realPositions: []
        } : null,
        isLoggedIn: state.isLoggedIn,
        kycStatus: state.kycStatus,
        soundEnabled: state.soundEnabled,
        sfxVolume: state.sfxVolume,
        ambientEnabled: state.ambientEnabled,
        ambientPreset: state.ambientPreset,
        streakCount: state.streakCount,
        lastLoginDate: state.lastLoginDate,
        claimedToday: state.claimedToday,
        spinWheelClaimedToday: state.spinWheelClaimedToday,
        dailyModalLastDismissedDate: state.dailyModalLastDismissedDate,
        unlockedAchievements: state.unlockedAchievements,
        xp: state.xp,
        points: state.points
      })
    }
  )
);

if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('AuraBet-trading-storage')) {
      localStorage.removeItem('AuraBet-trading-storage');
    }
  } catch (e) {}
}
