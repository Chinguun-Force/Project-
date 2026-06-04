"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Home, Plus, Share2, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isIosSafari } from "@/lib/pwa/iosInstall";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    step: 1,
    icon: Share2,
    title: "Tap Share",
    detail: "Tap the Share button (↗) at the bottom of Safari.",
  },
  {
    step: 2,
    icon: Plus,
    title: "Add to Home Screen",
    detail: 'Choose "Add to Home Screen" from the menu.',
  },
  {
    step: 3,
    icon: Home,
    title: "Tap Add",
    detail: "Tap Add in the top-right corner. Nomad-Go will appear on your home screen.",
  },
] as const;

type IosInstallGuideProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, "Got it" snoozes the auto prompt for 7 days. */
  persistDismiss?: boolean;
  onDismiss?: () => void;
};

export function IosInstallGuide({
  open,
  onOpenChange,
  persistDismiss = true,
  onDismiss,
}: IosInstallGuideProps) {
  const inSafari = isIosSafari();

  const handleClose = (snooze: boolean) => {
    if (snooze && persistDismiss) onDismiss?.();
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close install guide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            onClick={() => handleClose(false)}
          />
          <motion.div
            role="dialog"
            aria-labelledby="ios-install-title"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[61] mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-emerald-500/25 bg-[#1A1D26] shadow-[0_-8px_40px_rgba(16,185,129,0.15)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#322F36]/80 bg-[#1A1D26]/95 px-5 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    id="ios-install-title"
                    className="text-base font-bold text-white"
                  >
                    Install on iPhone
                  </h2>
                  <p className="text-xs text-[#A0A0B0]">
                    Add Nomad-Go to your home screen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="rounded-lg p-2 text-[#A0A0B0] hover:bg-[#322F36] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5 pb-8">
              {!inSafari ? (
                <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  <p className="font-medium">Use Safari</p>
                  <p className="mt-1 text-xs text-amber-200/85">
                    &quot;Add to Home Screen&quot; is not available in Chrome or other
                    browsers on iOS. Open this site in Safari, then follow the steps
                    below.
                  </p>
                </div>
              ) : null}

              <p className="text-sm leading-relaxed text-[#E8E8F0]">
                Install Nomad-Go like a native app. Follow these{" "}
                <span className="font-semibold text-emerald-400">3 steps</span> in
                Safari.
              </p>

              <ol className="space-y-3">
                {STEPS.map((item) => (
                  <li
                    key={item.step}
                    className="flex gap-4 rounded-2xl border border-[#322F36] bg-[#252830]/80 p-4"
                  >
                    <span
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                        "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25",
                      )}
                    >
                      <item.icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F4C64D]/20 text-[10px] font-bold text-[#F4C64D]">
                          {item.step}
                        </span>
                        <p className="text-sm font-semibold text-white">
                          {item.title}
                        </p>
                      </div>
                      <p className="text-sm text-[#C8C8D8]">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 py-3 text-xs text-emerald-300/90">
                <Share2 className="h-4 w-4 animate-bounce" />
                <span>The Share button is at the bottom of Safari</span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                {persistDismiss ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#322F36] text-[#A0A0B0] hover:text-white"
                    onClick={() => handleClose(false)}
                  >
                    Later
                  </Button>
                ) : null}
                <Button
                  type="button"
                  className="bg-[#F4C64D] font-semibold text-[#1A1D26] hover:bg-[#F4C64D]/90"
                  onClick={() => handleClose(true)}
                >
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
