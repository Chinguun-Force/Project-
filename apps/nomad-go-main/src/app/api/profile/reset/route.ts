import { NextResponse } from "next/server";
import { resetDemoUser } from "@/lib/server/game";

export async function POST() {
  try {
    const snapshot = await resetDemoUser();
    return NextResponse.json({
      message: "Демо төлөв шинэчлэгдлээ.",
      snapshot,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Демог дахин эхлүүлэхэд алдаа гарлаа.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
