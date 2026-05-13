/** Neon Emerald design tokens (CSS / Tailwind-friendly). */
export const neonEmeraldTheme = {
  color: {
    primary: "#00FFB2",
    primarySoft: "#6DFFD1",
    accent: "#0AFFE5",
    background: "#041413",
    surface: "#0A2421",
    text: "#E8FFF8",
  },
  glow: {
    shadowSm: "0 0 12px rgba(0, 255, 178, 0.35)",
    shadowMd: "0 0 20px rgba(10, 255, 229, 0.45)",
  },
} as const;

export type NeonEmeraldTheme = typeof neonEmeraldTheme;

/** Tailwind v4-style CSS variable map for `@theme` / globals. */
export const neonEmeraldCssVars = {
  "--color-neon-primary": neonEmeraldTheme.color.primary,
  "--color-neon-primary-soft": neonEmeraldTheme.color.primarySoft,
  "--color-neon-accent": neonEmeraldTheme.color.accent,
  "--color-neon-background": neonEmeraldTheme.color.background,
  "--color-neon-surface": neonEmeraldTheme.color.surface,
  "--color-neon-text": neonEmeraldTheme.color.text,
} as const;
