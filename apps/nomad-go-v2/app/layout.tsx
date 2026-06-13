import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "../src/providers/trpc";
import { PwaClient } from "@/components/PwaClient";
import { OfflineSyncBridge } from "@/components/OfflineSyncBridge";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nomad-Go",
  description: "Adventure tracking and gamification",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icons/icon-192x192.png",
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nomad-Go",
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
