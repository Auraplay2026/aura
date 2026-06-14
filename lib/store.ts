import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { recordGameRound } from './recordRound';

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
  role?: 'user' | 'admin';
  kycStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  kycDocumentUrl?: string;
  notifications?: { id: string; message: string; timestamp: number; read: boolean }[];
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

  // Actions
  deposit: (amount: number, method?: string) => void;
  placeTrade: (marketId: string, marketTitle: string, side: 'yes' | 'no', investment: number, currentPrice: number) => void;
  cashOut: (positionId: string, currentMarketPrice: number) => void;
  repairState: () => void;
  syncFromServer: () => Promise<void>;
  
  // Auth Actions
  login: () => Promise<void>;
  logout: () => void;
  signUp: (username: string, email: string, passwordHash: string, accountType?: 'demo' | 'real', referralCode?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (emailOrUsername: string, passwordHash: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (email: string, username: string) => Promise<{ success: boolean; error?: string }>;
  switchAccountType: (type: 'demo' | 'real') => Promise<void>;
  completeOnboarding: (phoneNumber?: string, gamingState?: string, upiId?: string) => Promise<void>;
  updateProfile: (updates: { username?: string; phoneNumber?: string; upiId?: string; gamingState?: string; notifications?: { id: string; message: string; timestamp: number; read: boolean; title?: string }[] }) => Promise<boolean>;

  // Sportsbook
  placeSportsBet: (matchTitle: string, selection: string, odds: number, stake: number) => void;
  cancelSportsBet: (transactionId: string) => void;

  // Casino
  playCasino: (wager: number, payout: number, gameTitle: string) => void;
  houseEdge: number;
  fetchSystemConfig: () => Promise<void>;
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
  const positionsToUse = newPositions !== undefined ? newPositions : state.positions;
  
  if (state.isLoggedIn && state.currentUser) {
    const accountType = state.currentUser.accountType || 'demo';
    const hasCompletedOnboarding = state.currentUser.hasCompletedOnboarding;
    const { phoneNumber, gamingState, upiId, totalWagered, vipLevel, manualVipLevel, vipRewardsClaimed } = state.currentUser;
    syncWithServer(
      state.currentUser.email, 
      accountType, 
      newBalance, 
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
    balance: newBalance,
    transactions: newTransactions,
    positions: positionsToUse,
    currentUser: state.currentUser 
      ? { ...state.currentUser, balance: newBalance, transactions: newTransactions, positions: positionsToUse }
      : null
  };
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
      houseEdge: 2.0, // Default 2% house edge

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
              transactions: data.user.transactions
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
              transactions: data.user.transactions
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
            transactions: data.user.transactions
          });
          return { success: true };
        } catch (err) {
          return { success: false, error: "Network error. Please try again." };
        }
      },

      loginWithCredentials: async (emailOrUsername, password) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrUsername, password })
          });
          const data = await res.json();
          if (!res.ok) {
            return { success: false, error: data.error || "Login failed." };
          }
          
          const sanitizedUser = sanitizeClientUserProfile(data.user);
          set({
            currentUser: sanitizedUser,
            isLoggedIn: true,
            balance: sanitizedUser ? sanitizedUser.balance : 0,
            positions: data.user.positions,
            transactions: data.user.transactions
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
            transactions: data.user.transactions
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

      placeTrade: (marketId, marketTitle, side, investment, currentPrice) => set((state) => {
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }

        // Security check: Prevent overdrafts and negative wagers
        if (investment <= 0 || investment > safeBalance) {
          console.error("Invalid investment amount or insufficient balance");
          return state;
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

        recordGameRound({
          gameId: 'predictions',
          userId: 'current-user',
          wager: investment,
          payout: 0, 
          multiplier: 0,
          won: false,
        });

        const newTransactions = [tx, ...state.transactions];
        const newPositions = [newPosition, ...state.positions];

        return getSyncedStateAndSync(state, newBalance, newTransactions, newPositions);
      }),

      placeSportsBet: (matchTitle, selection, odds, stake) => set((state) => {
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }

        // Security check: Prevent overdrafts and negative wagers
        if (stake <= 0 || stake > safeBalance) {
          console.error("Invalid stake amount or insufficient balance");
          return state;
        }

        const newBalance = safeBalance - stake;
        
        let newTotalWagered = state.currentUser?.totalWagered || 0;
        let newVipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' = state.currentUser?.vipLevel || 'Bronze';
        if (state.currentUser) {
          newTotalWagered += stake;
          newVipLevel = calculateVipLevel(newTotalWagered, state.currentUser.manualVipLevel) as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
          state.currentUser.totalWagered = newTotalWagered;
          state.currentUser.vipLevel = newVipLevel;
        }

        const tx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: 'trade',
          amount: stake,
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `Placed ₹${stake} bet on ${selection} @ ${odds.toFixed(2)} (${matchTitle})`,
          status: 'Pending'
        };

        recordGameRound({
          gameId: 'sportsbook',
          userId: 'current-user',
          wager: stake,
          payout: 0,
          multiplier: odds,
          won: false,
        });

        const newTransactions = [tx, ...state.transactions];
        return getSyncedStateAndSync(state, newBalance, newTransactions);
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

      playCasino: (wager, payout, gameTitle) => set((state) => {
        let safeBalance = state.balance;
        if (typeof safeBalance !== 'number') {
           const parsed = parseFloat(String(safeBalance));
           safeBalance = isNaN(parsed) ? 100000 : parsed;
        }

        // Security check: Prevent overdrafts and negative wagers/payouts
        if (wager <= 0 || wager > safeBalance || payout < 0) {
          console.error("Invalid wager/payout or insufficient balance");
          return state;
        }

        const netChange = payout - wager;
        const newBalance = safeBalance + netChange;

        let newTotalWagered = state.currentUser?.totalWagered || 0;
        let newVipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' = state.currentUser?.vipLevel || 'Bronze';
        if (state.currentUser) {
          newTotalWagered += wager;
          newVipLevel = calculateVipLevel(newTotalWagered, state.currentUser.manualVipLevel) as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
          state.currentUser.totalWagered = newTotalWagered;
          state.currentUser.vipLevel = newVipLevel;
        }

        const tx: Transaction = {
          id: `TX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          type: 'casino',
          amount: Math.abs(netChange),
          balanceAfter: newBalance,
          timestamp: Date.now(),
          details: `Played ${gameTitle} (Wager: ₹${wager}, Payout: ₹${payout})`,
          status: 'Completed'
        };

        const newTransactions = [tx, ...state.transactions];
        return getSyncedStateAndSync(state, newBalance, newTransactions);
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

        recordGameRound({
          gameId: 'predictions_cashout',
          userId: 'current-user',
          wager: position.investment,
          payout: currentValue,
          multiplier: currentValue / position.investment,
          won: currentValue > position.investment,
        });

        const newTransactions = [tx, ...state.transactions];
        return getSyncedStateAndSync(state, newBalance, newTransactions, updatedPositions);
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
        
        return getSyncedStateAndSync(state, safeBalance, safeTransactions, safePositions);
      }),

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
      }
    }),
    {
      name: 'AuraBet-trading-storage', // key in localStorage
    }
  )
);
