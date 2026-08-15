import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders";
import { GlobalAlerts } from "@/components/ui/GlobalAlerts";
import { GlobalHypeFeed } from "@/components/ui/GlobalHypeFeed";
import { DailyRewardModal } from "@/components/ui/DailyRewardModal";
import { RewardsModal } from "@/components/ui/RewardsModal";
import { AchievementToast } from "@/components/ui/AchievementToast";
import { WinCelebration } from "@/components/ui/WinCelebration";
import { SmartNotificationBanner } from "@/components/ui/SmartNotificationBanner";

import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export const viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "AuraPlay Exchange | Next-Gen Casino & Cloud Gaming",
  description: "Top 1% iGaming and Sportsbook Ecosystem. Play premium casino games, bet on live sports, and stream AAA titles via cloud nodes directly from your browser.",
  keywords: "casino, crypto casino, cloud gaming, sportsbook, betting, AAA games, live dealer, slots",
  authors: [{ name: "AuraPlay" }],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://auraplay.com",
    siteName: "AuraPlay Exchange",
    title: "AuraPlay Exchange | Next-Gen Casino & Cloud Gaming",
    description: "Top 1% iGaming and Sportsbook Ecosystem. Experience the future of entertainment.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=1200&h=630&q=80",
        width: 1200,
        height: 630,
        alt: "AuraPlay Exchange Ecosystem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AuraPlay Exchange | Next-Gen Casino & Cloud Gaming",
    description: "Top 1% iGaming and Sportsbook Ecosystem. Experience the future of entertainment.",
    images: ["https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=1200&h=630&q=80"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased selection:bg-red-200/50 selection:text-red-900 pb-20 md:pb-0" style={{ fontFamily: "'Outfit', sans-serif" }}>
        <AppProviders>
          <GlobalAlerts />
          <GlobalHypeFeed />
          <DailyRewardModal />
          <RewardsModal />
          <AchievementToast />
          <WinCelebration />
          <SmartNotificationBanner />
          {children}
          <MobileBottomNav />
        </AppProviders>
      </body>
    </html>
  );
}
