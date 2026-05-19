"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DeferredInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type WorkboxLike = {
  addEventListener: (type: "waiting" | "controlling", listener: () => void) => void;
  removeEventListener: (type: "waiting" | "controlling", listener: () => void) => void;
  messageSkipWaiting: () => void;
};

declare global {
  interface Window {
    workbox?: WorkboxLike;
  }
}

export function PwaClient() {
  const [isOffline, setIsOffline] = useState(false);
  const [installEvent, setInstallEvent] = useState<DeferredInstallPromptEvent | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  const isIosInstallable = () => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua);
    const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    return ios && !standalone;
  };

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as DeferredInstallPromptEvent);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const key = "ios-install-prompt-dismissed-at";
    const dismissedAtRaw = localStorage.getItem(key);
    const dismissedAt = dismissedAtRaw ? Number(dismissedAtRaw) : 0;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const shouldShow = isIosInstallable() && (!dismissedAt || Date.now() - dismissedAt > sevenDaysMs);
    setShowIosPrompt(shouldShow);
  }, []);

  useEffect(() => {
    if (!window.workbox) return;

    const handleWaiting = () => setIsUpdateAvailable(true);
    const handleControlling = () => window.location.reload();

    window.workbox.addEventListener("waiting", handleWaiting);
    window.workbox.addEventListener("controlling", handleControlling);

    return () => {
      window.workbox?.removeEventListener("waiting", handleWaiting);
      window.workbox?.removeEventListener("controlling", handleControlling);
    };
  }, []);

  return (
    <>
      {isOffline ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs text-amber-300 backdrop-blur-md">
          You are offline. Realtime will reconnect automatically.
        </div>
      ) : null}

      {installEvent ? (
        <button
          type="button"
          onClick={async () => {
            await installEvent.prompt();
            await installEvent.userChoice;
            setInstallEvent(null);
          }}
          className="fixed bottom-4 right-4 z-50 rounded-xl bg-primary px-4 py-2 text-xs text-background shadow-lg"
        >
          Install App
        </button>
      ) : null}

      {isUpdateAvailable ? (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-primary/40 bg-background/95 px-3 py-2 text-xs text-foreground shadow-lg backdrop-blur">
          <span>Update available</span>
          <button
            type="button"
            onClick={() => window.workbox?.messageSkipWaiting()}
            className="rounded-md bg-primary px-2 py-1 text-background"
          >
            Refresh
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {showIosPrompt ? (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 18, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-20 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl border border-emerald-400/35 bg-background/95 px-4 py-3 text-sm text-foreground shadow-[0_0_20px_rgba(16,185,129,0.22)] backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md border border-emerald-400/35 text-emerald-300">
              ⬆
            </span>
            <p className="leading-relaxed">
            Get Nomad-Go on your home screen: Tap 'Share' and choose 'Add to Home Screen'.
            </p>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("ios-install-prompt-dismissed-at", String(Date.now()));
                setShowIosPrompt(false);
              }}
              className="rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </>
  );
}
