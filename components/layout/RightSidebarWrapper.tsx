"use client";

import { LiveChat } from "@/components/LiveChat";
import { motion } from "framer-motion";
import { useSidebarContext } from "@/components/layout/AppProviders";

export function RightSidebarWrapper() {
  const { isChatOpen, setIsChatOpen } = useSidebarContext();

  return (
    <>
      <motion.div
        initial={false}
        animate={{ width: isChatOpen ? 320 : 0, borderLeftWidth: isChatOpen ? 1 : 0 }}
        className="hidden lg:flex h-screen shrink-0 border-white/5 bg-[#151623] flex-col z-20 relative overflow-hidden transition-colors"
      >
        <div className="w-80 h-full flex flex-col shrink-0">
          <LiveChat isDocked={true} onClose={() => setIsChatOpen(false)} />
        </div>
      </motion.div>
    </>
  );
}
