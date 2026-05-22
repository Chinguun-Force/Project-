"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  canAccessAdmin,
  canAccessModerator,
  normalizeRole,
  type AppRole,
} from "@/lib/auth/roles";

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setRole("user");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setRole(normalizeRole(data?.role));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return {
    role,
    loading,
    isAdmin: canAccessAdmin(role),
    isModerator: role === "moderator",
    canAccessAdmin: canAccessAdmin(role),
    canAccessModerator: canAccessModerator(role),
  };
}
