import { create } from 'zustand';

interface AdminSessionState {
  adminEmail: string | null;
  adminToken: string | null;
  adminHwSignature: string | null;
  isAuthenticated: boolean;
  lastActivity: number;
  setAdminSession: (email: string, token: string, hwSignature: string) => void;
  clearAdminSession: () => void;
  updateActivity: () => void;
  checkIdleTimeout: () => void;
}

export const useAdminStore = create<AdminSessionState>((set, get) => ({
  adminEmail: null,
  adminToken: null,
  adminHwSignature: null,
  isAuthenticated: false,
  lastActivity: Date.now(),

  setAdminSession: (email, token, hwSignature) => set({
    adminEmail: email,
    adminToken: token,
    adminHwSignature: hwSignature,
    isAuthenticated: true,
    lastActivity: Date.now()
  }),

  clearAdminSession: () => {
    // Forcefully wipe all sensitive admin details from memory registers
    set({
      adminEmail: null,
      adminToken: null,
      adminHwSignature: null,
      isAuthenticated: false,
      lastActivity: 0
    });
  },

  updateActivity: () => set({
    lastActivity: Date.now()
  }),

  checkIdleTimeout: () => {
    const { isAuthenticated, lastActivity, clearAdminSession } = get();
    if (!isAuthenticated) return;

    const idleTime = Date.now() - lastActivity;
    if (idleTime > 300000) { // 300 seconds (5 minutes)
      console.warn("[Security Shield] Idle timeout exceeded 300 seconds. Wiping admin session registers.");
      clearAdminSession();
    }
  }
}));
