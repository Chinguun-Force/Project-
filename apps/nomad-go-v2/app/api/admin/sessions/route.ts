import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "*, journey_days!journey_days_session_id_fkey(*, journey_steps!journey_steps_day_id_fkey(*))"
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const payload = {
    name: body.name,
    location: body.location,
    start_date: body.start_date,
    end_date: body.end_date,
    guide_id: body.guide_id,
    invite_code: body.invite_code,
    is_active: body.is_active ?? true,
    ...(body.journey_data ? { journey_data: body.journey_data } : {}),
  };

  const { data, error } = await supabase.from("sessions").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates = {
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.location !== undefined ? { location: body.location } : {}),
    ...(body.start_date !== undefined ? { start_date: body.start_date } : {}),
    ...(body.end_date !== undefined ? { end_date: body.end_date } : {}),
    ...(body.guide_id !== undefined ? { guide_id: body.guide_id } : {}),
    ...(body.invite_code !== undefined ? { invite_code: body.invite_code } : {}),
    ...(body.is_active !== undefined ? { is_active: body.is_active } : {}),
    ...(body.journey_data !== undefined ? { journey_data: body.journey_data } : {}),
  };

  const { data, error } = await supabase
    .from("sessions")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
