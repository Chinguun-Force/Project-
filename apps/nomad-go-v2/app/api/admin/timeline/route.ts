import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";

export async function GET(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  let query = supabase
    .from("timeline_items")
    .select("*")
    .order("day_number", { ascending: true })
    .order("time_slot", { ascending: true });

  if (sessionId) query = query.eq("session_id", sessionId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const payload = {
    session_id: body.session_id,
    day_number: body.day_number,
    time_slot: body.time_slot,
    title: body.title,
    description: body.description ?? null,
    quest_id: body.quest_id ?? null,
    tip_id: body.tip_id ?? null,
  };

  const { data, error } = await supabase.from("timeline_items").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates = {
    ...(body.session_id !== undefined ? { session_id: body.session_id } : {}),
    ...(body.day_number !== undefined ? { day_number: body.day_number } : {}),
    ...(body.time_slot !== undefined ? { time_slot: body.time_slot } : {}),
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.quest_id !== undefined ? { quest_id: body.quest_id } : {}),
    ...(body.tip_id !== undefined ? { tip_id: body.tip_id } : {}),
  };

  const { data, error } = await supabase
    .from("timeline_items")
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

  const { error } = await supabase.from("timeline_items").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
