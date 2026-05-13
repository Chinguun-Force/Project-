import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Project α — Монголын адал явдал",
    template: "%s · Project α",
  },
  description:
    "Монгол орноор аялж, даалгавар биелүүлж, XP цуглуулан түвшин ахиулж, бодит газруудыг нээ.",
  applicationName: "Project α",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png?v=2",
    shortcut: "/icon.png?v=2",
    apple: "/apple-icon.png?v=2",
  },
  appleWebApp: {
    capable: true,
    title: "Project α",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef4f7" },
    { media: "(prefers-color-scheme: dark)", color: "#1c2429" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#f4f6f8] text-[#1c2429]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
