import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseConfig } from "@/utils/supabase/config";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { redeemableId, locationNote } = await req.json();
    if (!redeemableId) return NextResponse.json({ error: "redeemableId is required" }, { status: 400 });

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    const { url } = getSupabaseConfig();
    const service = createServiceClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: profile, error: profileError } = await service
      .from("users")
      .select("points")
      .eq("id", user.id)
      .single();
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    const { data: redeemable, error: redeemableError } = await service
      .from("redeemables")
      .select("id, point_cost, stock_count, title")
      .eq("id", redeemableId)
      .single();
    if (redeemableError) return NextResponse.json({ error: redeemableError.message }, { status: 400 });

    const currentPoints = Number(profile.points ?? 0);
    const cost = Number(redeemable.point_cost ?? 0);
    const stock = Number(redeemable.stock_count ?? 0);

    if (stock <= 0) return NextResponse.json({ error: "Out of stock" }, { status: 400 });
    if (currentPoints < cost) return NextResponse.json({ error: "Not enough points" }, { status: 400 });

    const { error: userUpdateError } = await service
      .from("users")
      .update({ points: currentPoints - cost })
      .eq("id", user.id);
    if (userUpdateError) return NextResponse.json({ error: userUpdateError.message }, { status: 400 });

    const { error: redeemableUpdateError } = await service
      .from("redeemables")
      .update({ stock_count: stock - 1 })
      .eq("id", redeemableId);
    if (redeemableUpdateError) return NextResponse.json({ error: redeemableUpdateError.message }, { status: 400 });

    const { data: history, error: historyError } = await service
      .from("redemptions")
      .insert({
        user_id: user.id,
        item_id: redeemableId,
        status: "pending",
        location_note: locationNote ?? null,
      })
      .select()
      .single();
    if (historyError) return NextResponse.json({ error: historyError.message }, { status: 400 });

    return NextResponse.json({
      success: true,
      redemption: history,
      available_points: currentPoints - cost,
      redeemed_title: redeemable.title,
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

