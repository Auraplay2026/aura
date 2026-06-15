"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useTradingStore } from "@/lib/store";

interface SidebarContextType {
  isChatOpen: boolean;
  setIsChatOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isChatOpen: true,
  setIsChatOpen: () => {},
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => {},
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global State Repair & Auto Sync
  useEffect(() => {
    // 1. Repair broken local storage on mount
    useTradingStore.getState().repairState();

    // 2. Load system configurations (house edge, settings)
    useTradingStore.getState().fetchSystemConfig();

    // 3. Poll server every 10s for admin approvals (e.g., deposits/withdrawals)
    const interval = setInterval(() => {
      const storeState = useTradingStore.getState();
      storeState.syncFromServer();
      storeState.fetchSystemConfig();

      // 4. Automatic KYC Approval after 10 minutes (600,000 ms)
      if (
        storeState.isLoggedIn && 
        storeState.currentUser && 
        storeState.kycStatus === 'PROCESSING' && 
        storeState.kycSubmittedAt
      ) {
        const elapsed = Date.now() - storeState.kycSubmittedAt;
        if (elapsed >= 10 * 60 * 1000) {
          storeState.setKycStatus('VERIFIED');
          
          // Dispatch verification success notification
          const newNotif = {
            id: `NOTIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            message: "Congratulations! Your Tier 2 KYC Identity Verification (PAN & Aadhaar) has been successfully verified. Your account limits have been upgraded.",
            timestamp: Date.now(),
            read: false
          };
          storeState.updateProfile({
            notifications: [...(storeState.currentUser?.notifications || []), newNotif]
          });
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SidebarContext.Provider value={{ isChatOpen, setIsChatOpen, isMobileMenuOpen, setIsMobileMenuOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebarContext = () => useContext(SidebarContext);
