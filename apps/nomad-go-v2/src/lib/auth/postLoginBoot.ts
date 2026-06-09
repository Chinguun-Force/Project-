const BOOT_FLAG_KEY = "nomad:post-login-boot";
export const MIN_BOOT_DISPLAY_MS = 700;

export function markPostLoginBoot(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(BOOT_FLAG_KEY, "1");
}

export function shouldShowPostLoginBoot(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(BOOT_FLAG_KEY) === "1";
}

export function clearPostLoginBoot(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(BOOT_FLAG_KEY);
}

export function waitMinBoot(ms = MIN_BOOT_DISPLAY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
