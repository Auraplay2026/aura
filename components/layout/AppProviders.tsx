"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useTradingStore } from "@/lib/store";

interface SidebarContextType {
  isChatOpen: boolean;
  setIsChatOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isChatOpen: true,
  setIsChatOpen: () => {},
});

export function AppProviders({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Global State Repair & Auto Sync
  useEffect(() => {
    // 1. Repair broken local storage on mount
    useTradingStore.getState().repairState();

    // 2. Load system configurations (house edge, settings)
    useTradingStore.getState().fetchSystemConfig();

    // 3. Poll server every 10s for admin approvals (e.g., deposits/withdrawals)
    const interval = setInterval(() => {
      useTradingStore.getState().syncFromServer();
      useTradingStore.getState().fetchSystemConfig();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SidebarContext.Provider value={{ isChatOpen, setIsChatOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebarContext = () => useContext(SidebarContext);
