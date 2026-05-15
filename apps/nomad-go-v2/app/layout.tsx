import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "../src/providers/trpc";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nomad-Go V2",
  description: "Adventure tracking and gamification",
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
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
