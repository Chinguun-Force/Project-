import type { Metadata } from "next";
import { AchievementsClient } from "./AchievementsClient";

export const metadata: Metadata = {
  title: "Амжилт",
};

export default function AchievementsPage() {
  return <AchievementsClient />;
}
