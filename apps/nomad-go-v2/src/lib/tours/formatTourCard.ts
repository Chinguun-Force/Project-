export type MissionBadge = {
  id: string;
  title: string;
  image_url?: string | null;
  xp_reward?: number | null;
};

export type TourCardMissions = {
  /** All missions sorted by XP descending */
  missions: MissionBadge[];
  /** Top 2 for badge row */
  topMissions: MissionBadge[];
  /** Count for +N badge (0 if ≤2 missions) */
  extraMissionCount: number;
};

export function sortMissionsByXp(missions: MissionBadge[]): MissionBadge[] {
  return [...missions].sort(
    (a, b) => (b.xp_reward ?? 0) - (a.xp_reward ?? 0),
  );
}

export function formatTourCardMissions(
  raw: MissionBadge[] | null | undefined,
): TourCardMissions {
  const missions = sortMissionsByXp(raw ?? []);
  const topMissions = missions.slice(0, 2);
  const extraMissionCount = Math.max(0, missions.length - 2);
  return { missions, topMissions, extraMissionCount };
}

export function extractMissionsFromTripJoin(
  tripMissions: { missions: unknown }[] | null | undefined,
): MissionBadge[] {
  return (tripMissions ?? []).flatMap((row) => {
    const raw = row.missions;
    const m = (Array.isArray(raw) ? raw[0] : raw) as MissionBadge | null;
    return m?.id && m?.title ? [m] : [];
  });
}

export function extractMissionsFromSessionJoin(
  sessionMissions: { missions: unknown }[] | null | undefined,
): MissionBadge[] {
  return extractMissionsFromTripJoin(
    sessionMissions as { missions: unknown }[],
  );
}
