import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { isGuide } from "@/lib/auth/roles";
import GuideShell from "./GuideShell";

export default async function GuideLayout({
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
    .select("role, tenant_id, full_name, tenants(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (!isGuide(profile?.role)) {
    redirect("/");
  }

  const tenantJoin = profile.tenants as { name: string } | { name: string }[] | null;
  const companyName = profile.tenant_id
    ? Array.isArray(tenantJoin)
      ? tenantJoin[0]?.name ?? null
      : tenantJoin?.name ?? null
    : null;

  return (
    <GuideShell
      companyName={companyName}
      guideName={profile.full_name}
      awaitingCompany={!profile.tenant_id}
    >
      {children}
    </GuideShell>
  );
}
