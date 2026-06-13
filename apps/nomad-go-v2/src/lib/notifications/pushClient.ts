"use client";

/**
 * Client-side Web Push helpers.
 *
 * A dedicated push service worker is registered at a narrow scope so it never
 * clashes with the next-pwa app-shell worker registered at "/". Push events are
 * delivered to the registration that created the subscription regardless of
 * scope, so notifications still work app-wide.
 */

const PUSH_SW_URL = "/push-sw.js";
const PUSH_SW_SCOPE = "/push-sw-scope/";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPushPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/**
 * Returns a human-readable reason why push can't be enabled, or null if it can.
 * Used to give the user actionable feedback instead of a silent disabled toggle.
 */
export function getPushUnavailableReason(): string | null {
  if (typeof window === "undefined") return null;

  if (!window.isSecureContext) {
    return "Push needs a secure connection (HTTPS). On your phone, open the deployed https:// site or an HTTPS tunnel — a local http://<ip>:3000 address won't work.";
  }
  if (!("serviceWorker" in navigator)) {
    return "Service workers aren't available in this browser.";
  }
  if (!("PushManager" in window) || !("Notification" in window)) {
    return "Push notifications aren't supported in this browser.";
  }

  const ua = navigator.userAgent || "";
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (isIos && !isStandalone) {
    return "On iPhone/iPad, add Nomad-Go to your Home Screen first (Share → Add to Home Screen), then open it and enable notifications.";
  }

  if (Notification.permission === "denied") {
    return "Notifications are blocked for this site. Enable them in your browser/site settings, then try again.";
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return "Push isn't configured (missing VAPID key). If you just added it, restart the dev server.";
  }

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

/** Resolves once the given registration has an activated service worker. */
function waitForActiveWorker(
  registration: ServiceWorkerRegistration
): Promise<ServiceWorkerRegistration> {
  if (registration.active) return Promise.resolve(registration);

  return new Promise((resolve) => {
    const candidate = registration.installing || registration.waiting;
    if (!candidate) {
      resolve(registration);
      return;
    }
    candidate.addEventListener("statechange", () => {
      if (candidate.state === "activated") resolve(registration);
    });
  });
}

async function getPushRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration(PUSH_SW_SCOPE);
  const registration =
    existing ?? (await navigator.serviceWorker.register(PUSH_SW_URL, { scope: PUSH_SW_SCOPE }));
  // Wait for our own worker to activate rather than navigator.serviceWorker.ready,
  // which tracks the page-controlling worker and can hang in dev.
  return withTimeout(waitForActiveWorker(registration), 8000, "Service worker activation");
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_SCOPE);
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export type PushResult = { success: boolean; error?: string };

export async function subscribeToPush(): Promise<PushResult> {
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications are not supported on this device." };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return { success: false, error: "Push is not configured. Missing VAPID public key." };
  }

  try {
    const permission = await withTimeout(
      Promise.resolve(Notification.requestPermission()),
      60000,
      "Permission prompt"
    );
    if (permission !== "granted") {
      return {
        success: false,
        error:
          permission === "denied"
            ? "Notifications are blocked. Enable them in your browser/site settings, then try again."
            : "Notification permission was not granted.",
      };
    }

    const registration = await getPushRegistration();

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await withTimeout(
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }),
        15000,
        "Push subscribe"
      );
    }

    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || "Could not save subscription." };
    }

    return { success: true };
  } catch (err) {
    console.error("subscribeToPush failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to enable notifications.",
    };
  }
}

export async function unsubscribeFromPush(): Promise<PushResult> {
  if (!isPushSupported()) return { success: true };

  try {
    const subscription = await getExistingPushSubscription();
    if (!subscription) return { success: true };

    const { endpoint } = subscription;
    await subscription.unsubscribe();

    await fetch("/api/notifications/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint }),
    }).catch(() => {
      /* server cleanup is best-effort; local unsubscribe already done */
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to disable notifications.",
    };
  }
}
