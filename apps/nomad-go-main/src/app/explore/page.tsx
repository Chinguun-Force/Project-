import { ExploreMapClient } from "./ExploreMapClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Судлах",
};

export default function ExplorePage() {
  return <ExploreMapClient />;
}
