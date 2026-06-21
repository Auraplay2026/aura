"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/adminStore";

export default function AdminLoginPage() {
  const isAuthenticated = useAdminStore(state => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-slate-400 text-xs font-bold animate-pulse">
        AURA SECURITY CORE INITIALIZING...
      </div>
    </div>
  );
}
