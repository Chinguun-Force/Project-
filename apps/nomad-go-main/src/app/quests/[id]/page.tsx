import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getQuestById, MOCK_QUESTS } from "@/data/quests";
import { QuestDetailClient } from "./QuestDetailClient";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return MOCK_QUESTS.map((q) => ({ id: q.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const quest = getQuestById(id);
  if (!quest) return { title: "Даалгавар" };
  return { title: quest.title };
}

export default async function QuestDetailPage({ params }: Props) {
  const { id } = await params;
  const quest = getQuestById(id);
  if (!quest) notFound();
  return <QuestDetailClient quest={quest} />;
}
