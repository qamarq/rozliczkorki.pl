export const colors = {
  bg: "#0b0b10",
  bgElevated: "#131318",
  surface: "#1a1a22",
  surfaceHover: "#22222c",
  border: "#2a2a35",
  borderSubtle: "#1f1f28",
  text: "#f4f4f6",
  textMuted: "#9a9aa8",
  textFaint: "#6b6b78",
  accentFrom: "#8b5cf6",
  accentTo: "#6366f1",
  success: "#34d399",
  successBg: "#0f2b22",
  warning: "#fbbf24",
  warningBg: "#2b230f",
  danger: "#f87171",
  dangerBg: "#2b1414",
};

export const gradients = {
  accent: [colors.accentFrom, colors.accentTo] as const,
  header: ["#1c1730", "#0b0b10"] as const,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  full: 999,
};

export const spacing = (n: number) => n * 4;

/** Shared by every tab screen so all four titles sit at the same height. */
export const tabHeaderTop = 8;
