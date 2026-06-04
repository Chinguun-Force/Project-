import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/utils/supabase/config";
import { PROFILES_TABLE } from "@/lib/auth/profile";

export async function getAdminClient() {
  // 1) Use the cookie-based client to identify the current user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile, error } = await supabase
    .from(PROFILES_TABLE)
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { errorResponse: NextResponse.json({ error: error.message }, { status: 400 }) };
  }

  if (profile?.role !== "admin") {
    return { errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  // 2) Use service role for admin CRUD to bypass RLS safely.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return {
      errorResponse: NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      ),
    };
  }

  const { url } = getSupabaseConfig();
  const adminSupabase = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { supabase: adminSupabase };
}
