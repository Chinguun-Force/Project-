import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { canAccessModerator } from "@/lib/auth/roles";

export default async function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessModerator(profile?.role)) {
    redirect("/");
  }

  return <>{children}</>;
}
