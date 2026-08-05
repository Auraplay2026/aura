import type { Metadata } from "next";
import { Outfit } from "next/font/google";
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

const outfit = Outfit({ subsets: ["latin"], display: 'swap', weight: ['300', '400', '500', '600', '700', '800', '900'] });

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
  const jsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    "name": "AuraPlay Exchange",
    "url": "https://auraplay.com",
    "logo": "https://auraplay.com/logo.png",
    "description": "Top 1% iGaming, Sportsbook Exchange, and Cloud Gaming Platform.",
    "sameAs": [
      "https://twitter.com/AuraPlay",
      "https://t.me/AuraPlayOfficial"
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${outfit.className} antialiased selection:bg-red-200/50 selection:text-red-900 pb-16 md:pb-0`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
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
