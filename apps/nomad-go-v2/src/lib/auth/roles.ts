export type AppRole = "admin" | "moderator" | "guide" | "tourist" | "user";

export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === "admin" || role === "moderator" || role === "guide" || role === "tourist") {
    return role;
  }
  return "user";
}

export function canAccessAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === "admin";
}

export function canAccessModerator(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "moderator";
}
