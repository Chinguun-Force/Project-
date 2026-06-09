const SUCCESS_PATTERN: number | number[] = [100, 50, 100];

export function triggerQuestHaptic(): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }
  try {
    navigator.vibrate(SUCCESS_PATTERN);
  } catch {
    // Graceful no-op on unsupported platforms
  }
}
