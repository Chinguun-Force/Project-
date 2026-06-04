import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "../src/providers/trpc";
import Script from "next/script";
import { PwaClient } from "@/components/PwaClient";
import { OfflineSyncBridge } from "@/components/OfflineSyncBridge";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nomad-Go V2",
  description: "Adventure tracking and gamification",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/icon-192x192.svg",
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nomad-Go V2",
  },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "25093cb5-8f62-4d6d-a0d6-66d232900a27",
              });
            });
          `}
        </Script>
        <TRPCProvider>
          <AuthProvider>
            <PwaClient />
            <OfflineSyncBridge />
            {children}
            <Toaster />
          </AuthProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
