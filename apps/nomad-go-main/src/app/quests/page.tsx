import type { Metadata } from "next";
import { QuestsClient } from "./QuestsClient";

export const metadata: Metadata = {
  title: "Даалгавар",
};

export default function QuestsPage() {
  return <QuestsClient />;
}
