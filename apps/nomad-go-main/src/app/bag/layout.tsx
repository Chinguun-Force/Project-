import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Цүнх",
};

export default function BagLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
