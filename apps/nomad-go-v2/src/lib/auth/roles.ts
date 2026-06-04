/**
 * Nomad-Go roles (4 only):
 * - admin: platform super admin
 * - moderator: travel company staff (manages company, trips, rooms, hires guides)
 * - guide: field guide, belongs to a company (tenant)
 * - tourist: end traveler
 */
export type AppRole = "admin" | "moderator" | "guide" | "tourist" | "user";

export function normalizeRole(role: string | null | undefined): AppRole {
  if (
    role === "admin" ||
    role === "moderator" ||
    role === "guide" ||
    role === "tourist"
  ) {
    return role;
  }
  return "user";
}

export function isAdmin(role: string | null | undefined): boolean {
  return normalizeRole(role) === "admin";
}

/** Travel company staff — manages templates, rooms, team. */
export function isCompanyModerator(role: string | null | undefined): boolean {
  return normalizeRole(role) === "moderator";
}

export function isGuide(role: string | null | undefined): boolean {
  return normalizeRole(role) === "guide";
}

export function isTourist(role: string | null | undefined): boolean {
  return normalizeRole(role) === "tourist";
}

/** @alias isAdmin */
export function canAccessAdmin(role: string | null | undefined): boolean {
  return isAdmin(role);
}

/** Company panel: admin + company moderator. */
export function canAccessModerator(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "moderator";
}

export function showModeratorPanelNav(role: string | null | undefined): boolean {
  return canAccessModerator(role);
}

export function showAdminPanelNav(role: string | null | undefined): boolean {
  return isAdmin(role);
}

/** Staff UI (hide tourist nav): admin + company moderator only. */
export function isStaffRole(role: string | null | undefined): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "moderator";
}

/** Field guide — own panel, not tourist app. */
export function isGuideStaff(role: string | null | undefined): boolean {
  return normalizeRole(role) === "guide";
}

/** Any non-tourist app shell (redirect away from traveler routes). */
export function usesDedicatedAppShell(role: string | null | undefined): boolean {
  return isStaffRole(role) || isGuideStaff(role);
}

/** @deprecated Use isCompanyModerator */
export function isModeratorOnlyStaff(role: string | null | undefined): boolean {
  return isCompanyModerator(role);
}

export function getStaffHomePath(role: string | null | undefined): string {
  if (isCompanyModerator(role)) return "/moderator";
  if (isAdmin(role)) return "/admin";
  if (isGuideStaff(role)) return "/guide";
  return "/";
}

export function getPostLoginPath(role: string | null | undefined): string {
  if (usesDedicatedAppShell(role)) return getStaffHomePath(role);
  return "/";
}

export function canAccessGuide(role: string | null | undefined): boolean {
  return isGuideStaff(role);
}

const TOURIST_APP_PREFIXES = ["/quests", "/missions", "/tours", "/map"];

export function isTouristAppPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return TOURIST_APP_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
