import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const startedAt = Date.now();

    const { error } = await supabase.from("sessions").select("id").limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          service: "supabase",
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      service: "supabase",
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        service: "supabase",
        message,
      },
      { status: 500 },
    );
  }
}
