import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders";
import { GlobalAlerts } from "@/components/ui/GlobalAlerts";
import { GlobalHypeFeed } from "@/components/ui/GlobalHypeFeed";
import { DailyRewardModal } from "@/components/ui/DailyRewardModal";
import { AchievementToast } from "@/components/ui/AchievementToast";
import { WinCelebration } from "@/components/ui/WinCelebration";
import { SmartNotificationBanner } from "@/components/ui/SmartNotificationBanner";

const outfit = Outfit({ subsets: ["latin"], display: 'swap', weight: ['300', '400', '500', '600', '700', '800', '900'] });

export const viewport = {
  themeColor: "#f8fafc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
      <body suppressHydrationWarning className={`${outfit.className} antialiased selection:bg-red-200/50 selection:text-red-900`}>
        <AppProviders>
          <GlobalAlerts />
          <GlobalHypeFeed />
          <DailyRewardModal />
          <AchievementToast />
          <WinCelebration />
          <SmartNotificationBanner />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
