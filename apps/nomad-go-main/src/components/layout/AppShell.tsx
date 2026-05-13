import { XpLevelEffects } from "@/components/effects/XpLevelEffects";
import { SimChrome } from "@/components/layout/SimChrome";
import { StoreHydration } from "@/components/providers/StoreHydration";
import { ToastProvider } from "@/components/ui/ToastHost";
import { LanguageProvider } from "@/i18n/LanguageProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>
        <div className="sim-app min-h-dvh">
          <div className="sim-terrain" aria-hidden />
          <StoreHydration>
            <XpLevelEffects />
            <SimChrome>{children}</SimChrome>
          </StoreHydration>
        </div>
      </ToastProvider>
    </LanguageProvider>
  );
}
