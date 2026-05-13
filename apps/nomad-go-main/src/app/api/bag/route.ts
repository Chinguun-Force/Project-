import { NextResponse } from "next/server";
import { DEMO_USER_ID, getProfileSnapshot } from "@/lib/server/game";

export async function GET() {
  try {
    const snapshot = await getProfileSnapshot(DEMO_USER_ID);
    return NextResponse.json({
      inventory: snapshot.inventory,
      wallet: snapshot.wallet,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bag-ийн өгөгдөл уншихад алдаа гарлаа.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
