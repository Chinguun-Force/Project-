import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XP дэлгүүр",
};

export default function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
