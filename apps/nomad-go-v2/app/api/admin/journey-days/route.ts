import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const payload = {
    session_id: body.session_id,
    day_number: body.day_number,
    title: body.title,
    location: body.location ?? null,
  };

  const { data, error } = await supabase.from("journey_days").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

