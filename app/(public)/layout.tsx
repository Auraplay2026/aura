import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { LiveChat } from "@/components/LiveChat";
import { Footer } from "@/components/layout/Footer";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { CursorSpotlight } from "@/components/ui/CursorSpotlight";
import { AIConcierge } from "@/components/AIConcierge";
import { OnboardingModal } from "@/components/ui/OnboardingModal";
import { RightSidebarWrapper } from "@/components/layout/RightSidebarWrapper";
import { BackToTop } from "@/components/ui/BackToTop";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-[100dvh] overflow-hidden w-full relative">
      <GlobalLoader />
      <CursorSpotlight />
      <AIConcierge />
      <OnboardingModal />
      <BackToTop />

      {/* Animated Aurora Background Mesh (Safari Optimized) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-white">
        <div className="absolute -top-[40%] -left-[10%] w-[70%] h-[70%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)]" />
      </div>

      <Sidebar />
      
      <div className="flex-1 flex flex-col relative min-w-0 h-[100dvh] overflow-hidden z-10">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {children}
          <Footer />
        </main>
      </div>

      <RightSidebarWrapper />
      
      <div className="lg:hidden">
        <LiveChat isDocked={false} />
      </div>
    </div>
  );
}
