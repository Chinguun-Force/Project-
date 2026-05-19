import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { notifyRedeemableCreated } from "@/utils/notifications/webPush";

export async function GET() {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const { data, error } = await supabase.from("redeemables").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const payload = {
    title: body.title,
    description: body.description ?? null,
    point_cost: Number(body.point_cost ?? 0),
    image_url: body.image_url ?? null,
    stock_count: Number(body.stock_count ?? 0),
  };

  const { data, error } = await supabase.from("redeemables").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await notifyRedeemableCreated(data.title);
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates = {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.description !== undefined ? { description: body.description } : {}),
    ...(body.point_cost !== undefined ? { point_cost: Number(body.point_cost) } : {}),
    ...(body.image_url !== undefined ? { image_url: body.image_url } : {}),
    ...(body.stock_count !== undefined ? { stock_count: Number(body.stock_count) } : {}),
  };

  const { data, error } = await supabase
    .from("redeemables")
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

  const { error } = await supabase.from("redeemables").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

