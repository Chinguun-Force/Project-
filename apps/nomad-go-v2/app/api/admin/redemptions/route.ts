import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const withProfiles = await supabase
    .from("redemptions")
    .select("id, user_id, item_id, status, created_at, location_note, profiles(full_name, email), redeemables(title)")
    .order("created_at", { ascending: false });
  if (!withProfiles.error) return NextResponse.json(withProfiles.data ?? []);

  const withUsers = await supabase
    .from("redemptions")
    .select("id, user_id, item_id, status, created_at, location_note, users(full_name, email), redeemables(title)")
    .order("created_at", { ascending: false });
  if (withUsers.error) return NextResponse.json({ error: withUsers.error.message }, { status: 400 });
  return NextResponse.json(withUsers.data ?? []);
}

export async function PUT(req: Request) {
  const { supabase, errorResponse } = await getAdminClient();
  if (errorResponse) return errorResponse;

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { data, error } = await supabase
    .from("redemptions")
    .update({ status: body.status ?? "pending" })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

