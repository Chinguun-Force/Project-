export const IOS_INSTALL_DISMISS_KEY = "ios-install-prompt-dismissed-at";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const classicIos = /iPad|iPhone|iPod/.test(ua);
  const ipadOs =
    window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1;
  return classicIos || ipadOs;
}

export function isIosStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Add to Home Screen works reliably in Safari on iOS. */
export function isIosSafari(): boolean {
  if (!isIosDevice()) return false;
  const ua = window.navigator.userAgent;
  if (/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return false;
  return /Safari/.test(ua) && !/Chrome|Chromium/.test(ua);
}

export function canShowIosInstallGuide(): boolean {
  return isIosDevice() && !isIosStandalone();
}

export function shouldAutoShowIosInstallGuide(): boolean {
  if (!canShowIosInstallGuide()) return false;
  const dismissedAtRaw = localStorage.getItem(IOS_INSTALL_DISMISS_KEY);
  const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
  return !dismissedAt || Date.now() - dismissedAt > DISMISS_MS;
}

export function dismissIosInstallGuideForDays(): void {
  localStorage.setItem(IOS_INSTALL_DISMISS_KEY, String(Date.now()));
}

export function clearIosInstallGuideDismiss(): void {
  localStorage.removeItem(IOS_INSTALL_DISMISS_KEY);
}
