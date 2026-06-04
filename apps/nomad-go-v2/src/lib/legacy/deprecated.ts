import { NextResponse } from "next/server";

export const LEGACY_SESSION_MESSAGE =
  "Legacy sessions API removed. Use trips + rooms (moderator /moderator/rooms, tourist join via room_code on Home).";

export function legacySessionDeprecatedResponse() {
  return NextResponse.json(
    {
      error: LEGACY_SESSION_MESSAGE,
      migration: {
        moderatorRooms: "/moderator/rooms",
        touristJoin: "/",
        docs: "trips → rooms → room_code → room_members",
      },
    },
    { status: 410 },
  );
}
