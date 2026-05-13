import { NextResponse } from "next/server";
import {
  DEMO_USER_ID,
  getProfileSnapshot,
  updateDemoUserProfile,
} from "@/lib/server/game";

export async function GET() {
  try {
    const snapshot = await getProfileSnapshot(DEMO_USER_ID);
    return NextResponse.json(snapshot);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Профайл уншихад алдаа гарлаа.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      avatarId?: string;
      travelerType?: "explorer" | "food-hunter" | "culture-seeker" | "adventure-rider";
      onboarded?: boolean;
    };

    const snapshot = await updateDemoUserProfile({
      name: body.name?.trim(),
      avatarId: body.avatarId,
      travelerType: body.travelerType,
      onboarded: body.onboarded,
    });

    return NextResponse.json(snapshot);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Профайл шинэчлэхэд алдаа гарлаа.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
