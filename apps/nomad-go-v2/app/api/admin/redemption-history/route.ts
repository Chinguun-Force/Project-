import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const { data, error } = await supabase
    .from("redemption_history")
    .select("*, redeemables(title, point_cost), users(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("redemption_history")
    .update({ status: body.status ?? "pending" })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

