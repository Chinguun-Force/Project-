/** Maps room + trip + activities into the dashboard itinerary shape (legacy UI compat). */

export type DashboardJourneyStep = {
  id: string;
  title: string;
  time_slot: string;
  description?: string | null;
  status: string;
  xp_reward: number;
};

export type DashboardJourneyDay = {
  id: string;
  day_number: number;
  title: string;
  journey_steps: DashboardJourneyStep[];
};

export type ActiveExpeditionView = {
  id: string;
  tripId: string;
  name: string;
  location: string | null;
  room_code: string;
  image_url: string | null;
  journey_days: DashboardJourneyDay[];
};

const DEFAULT_ACTIVITY_XP = 25;

export function mapRoomToActiveExpedition(input: {
  room: { id: string; room_code: string; trip_id: string };
  trip: {
    title: string;
    location?: string | null;
    image_url?: string | null;
  } | null;
  activities: {
    id: string;
    name: string;
    sequence_order: number;
    status: string;
  }[];
}): ActiveExpeditionView {
  const sorted = [...input.activities].sort(
    (a, b) => a.sequence_order - b.sequence_order,
  );

  return {
    id: input.room.id,
    tripId: input.room.trip_id,
    name: input.trip?.title ?? "Your expedition",
    location: input.trip?.location ?? null,
    room_code: input.room.room_code,
    image_url: input.trip?.image_url ?? null,
    journey_days: [
      {
        id: `room-${input.room.id}-day-1`,
        day_number: 1,
        title: "Live itinerary",
        journey_steps: sorted.map((act) => ({
          id: act.id,
          title: act.name,
          time_slot: "",
          status: act.status,
          xp_reward:
            act.status === "in_progress" ? DEFAULT_ACTIVITY_XP : 0,
        })),
      },
    ],
  };
}
