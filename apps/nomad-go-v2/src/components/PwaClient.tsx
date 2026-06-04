"use client";

import { useEffect, useState } from "react";
import { IosInstallGuide } from "@/components/IosInstallGuide";
import {
  dismissIosInstallGuideForDays,
  shouldAutoShowIosInstallGuide,
} from "@/lib/pwa/iosInstall";

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
  const [showIosGuide, setShowIosGuide] = useState(false);

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
    if (shouldAutoShowIosInstallGuide()) {
      setShowIosGuide(true);
    }
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
          Offline mode — quests save locally and sync when you reconnect.
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

      <IosInstallGuide
        open={showIosGuide}
        onOpenChange={setShowIosGuide}
        persistDismiss
        onDismiss={dismissIosInstallGuideForDays}
      />
    </>
  );
}
