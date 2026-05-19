import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { questId } = await req.json();

    if (!questId) {
      return NextResponse.json({ error: "questId is required" }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select("id, point_reward")
      .eq("id", questId)
      .maybeSingle();
    if (questError) return NextResponse.json({ error: questError.message }, { status: 400 });
    if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

    const { data: userQuest, error: userQuestError } = await supabase
      .from("user_quests")
      .upsert(
        {
          user_id: user.id,
          quest_id: questId,
          status: "completed",
        },
        { onConflict: "user_id,quest_id" }
      )
      .select()
      .single();
    if (userQuestError) return NextResponse.json({ error: userQuestError.message }, { status: 400 });

    const { data: profileWithTotal } = await supabase
      .from("users")
      .select("points, total_points")
      .eq("id", user.id)
      .maybeSingle();

    if (profileWithTotal && "total_points" in profileWithTotal) {
      const totalPoints = Number((profileWithTotal as { total_points?: number }).total_points || 0);
      const nextTotalPoints = totalPoints + (quest.point_reward || 0);
      const { error: updateTotalError } = await supabase
        .from("users")
        .update({ total_points: nextTotalPoints })
        .eq("id", user.id);
      if (updateTotalError) return NextResponse.json({ error: updateTotalError.message }, { status: 400 });
      return NextResponse.json({
        success: true,
        user_quest: userQuest,
        points_added: quest.point_reward || 0,
        points: nextTotalPoints,
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("points")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

    const nextPoints = (profile?.points || 0) + (quest.point_reward || 0);
    const { error: updateError } = await supabase.from("users").update({ points: nextPoints }).eq("id", user.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    return NextResponse.json({
      success: true,
      user_quest: userQuest,
      points_added: quest.point_reward || 0,
      points: nextPoints,
    });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

