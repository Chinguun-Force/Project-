import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { canAccessModerator, isCompanyModerator } from "@/lib/auth/roles";
import ModeratorShell from "./ModeratorShell";

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
    .from("profiles")
    .select("role, tenant_id, tenants(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessModerator(profile?.role)) {
    redirect("/");
  }

  if (!isCompanyModerator(profile?.role)) {
    redirect("/admin");
  }

  if (!profile?.tenant_id) {
    redirect("/admin");
  }

  const tenantJoin = profile.tenants as { name: string } | { name: string }[] | null;
  const companyName = Array.isArray(tenantJoin)
    ? tenantJoin[0]?.name ?? null
    : tenantJoin?.name ?? null;

  return <ModeratorShell companyName={companyName}>{children}</ModeratorShell>;
}
