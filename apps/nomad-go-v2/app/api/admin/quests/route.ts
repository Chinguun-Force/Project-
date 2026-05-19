import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { notifyQuestCreated } from "@/utils/notifications/webPush";

export async function GET(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  let query = supabase.from("quests").select("*").order("created_at", { ascending: false });
  if (sessionId) query = query.eq("session_id", sessionId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const allowedTypes = new Set(["quiz", "photo", "action", "choice", "timer"]);
  const type = typeof body.type === "string" ? body.type.toLowerCase() : "";
  if (!allowedTypes.has(type)) {
    return NextResponse.json(
      { error: "Invalid quest type. Must be one of: quiz, photo, action, choice, timer." },
      { status: 400 }
    );
  }
  const payload = {
    session_id: body.session_id || null,
    type,
    title: body.title,
    description: body.description ?? null,
    point_reward: body.point_reward ?? 0,
    image_url: body.image_url ?? null,
    icon: body.icon ?? "🎯",
    location: body.location ?? null,
    category: body.category ?? "Daily Challenge",
    difficulty: body.difficulty ?? "easy",
    is_daily_quest: body.is_daily_quest ?? true,
    requires_code: body.requires_code ?? false,
    status: body.status ?? "available",
    is_dynamic: body.is_dynamic ?? false,
  };

  const { data, error } = await supabase.from("quests").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await notifyQuestCreated(data.title, (data.location as string | null) ?? null);
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const allowedTypes = new Set(["quiz", "photo", "action", "choice", "timer"]);
  const type =
    body.type !== undefined && typeof body.type === "string" ? body.type.toLowerCase() : undefined;
  if (type !== undefined && !allowedTypes.has(type)) {
    return NextResponse.json(
      { error: "Invalid quest type. Must be one of: quiz, photo, action, choice, timer." },
      { status: 400 }
    );
  }

  const updates = {
    ...(body.session_id !== undefined ? { session_id: body.session_id || null } : {}),
    ...(type !== undefined ? { type } : {}),
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.point_reward !== undefined ? { point_reward: body.point_reward } : {}),
    ...(body.image_url !== undefined ? { image_url: body.image_url } : {}),
    ...(body.icon !== undefined ? { icon: body.icon } : {}),
    ...(body.location !== undefined ? { location: body.location } : {}),
    ...(body.category !== undefined ? { category: body.category } : {}),
    ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
    ...(body.is_daily_quest !== undefined ? { is_daily_quest: body.is_daily_quest } : {}),
    ...(body.requires_code !== undefined ? { requires_code: body.requires_code } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.is_dynamic !== undefined ? { is_dynamic: body.is_dynamic } : {}),
  };

  const { data, error } = await supabase
    .from("quests")
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

  const { error } = await supabase.from("quests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
