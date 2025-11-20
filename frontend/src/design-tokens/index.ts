/**
 * GearLog Design System Tokens
 * 
 * Este arquivo contém todos os tokens de design do sistema GearLog.
 * Baseado no design system oficial da plataforma.
 * 
 * @version 1.0
 */

export const designTokens = {
  version: "1.0",
  meta: {
    name: "GearLog Design System Tokens",
    generatedFor: "AI-Code Generation",
    brand: "GearLog",
    modes: ["light", "dark"] as const,
  },

  global: {
    radius: {
      xs: "4px",
      sm: "8px",
      md: "10px",
      lg: "14px",
      xl: "20px",
      full: "999px",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
    },
    font: {
      family: {
        primary: "Inter, system-ui, sans-serif",
      },
      size: {
        xs: "12px",
        sm: "14px",
        md: "15px",
        lg: "18px",
        xl: "22px",
        xxl: "28px",
      },
      weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    shadow: {
      light: {
        card: "0 4px 20px rgba(0,0,0,0.04)",
      },
      dark: {
        card: "0 4px 20px rgba(0,0,0,0.25)",
      },
    },
  },

  colors: {
    light: {
      background: "#F8FAFC",
      surface: "#FFFFFF",
      surface_alt: "#F1F5F9",
      border: "#E2E8F0",
      text: {
        primary: "#0F172A",
        secondary: "#475569",
        muted: "#94A3B8",
      },
      accent: {
        primary: "#2563EB",
        secondary: "#4F46E5",
      },
      success: "#22C55E",
      warning: "#F59E0B",
      danger: "#EF4444",
      input: {
        bg: "#FFFFFF",
      },
      sidebar: {
        bg: "#FFFFFF",
        icon: "#334155",
      },
    },
    dark: {
      background: "#0F1117",
      surface: "#1A1C23",
      surface_alt: "#1F232A",
      border: "#2A2D33",
      text: {
        primary: "#F8FAFC",
        secondary: "#94A3B8",
        muted: "#64748B",
      },
      accent: {
        primary: "#3B82F6",
        secondary: "#6366F1",
      },
      success: "#22C55E",
      warning: "#F59E0B",
      danger: "#EF4444",
      input: {
        bg: "#1F2128",
      },
      sidebar: {
        bg: "#14161C",
        icon: "#CBD5E1",
      },
    },
  },

  components: {
    button: {
      primary: {
        height: "42px",
        radius: "10px", // md
        font_weight: 500, // medium
        padding: "0 18px",
        background: {
          light: "#2563EB",
          dark: "#3B82F6",
        },
        text: {
          light: "#FFFFFF",
          dark: "#FFFFFF",
        },
      },
      secondary: {
        radius: "10px", // md
        border_color: {
          light: "#E2E8F0",
          dark: "#2A2D33",
        },
      },
      ghost: {
        opacity: 0.6,
      },
    },
    input: {
      height: "42px",
      radius: "10px", // md
      padding: "0 14px",
      background: {
        light: "#FFFFFF",
        dark: "#1F2128",
      },
      border: {
        light: "#E2E8F0",
        dark: "#2A2D33",
      },
    },
    card: {
      radius: "14px", // lg
      padding: "20px",
      shadow: {
        light: "0 4px 20px rgba(0,0,0,0.04)",
        dark: "0 4px 20px rgba(0,0,0,0.25)",
      },
      background: {
        light: "#FFFFFF",
        dark: "#1A1C23",
      },
    },
    sidebar: {
      width: "260px",
      collapsed: "80px",
      item: {
        radius: "10px", // md
        height: "42px",
      },
      background: {
        light: "#FFFFFF",
        dark: "#14161C",
      },
    },
    badge: {
      radius: "999px", // full
      font_size: "12px", // xs
      padding: "2px 10px",
    },
  },

  charts: {
    line_thickness: 2,
    corner_radius: 6,
    grid_opacity: 0.15,
  },

  motion: {
    transition_default: "150ms ease-in-out",
    hover_scale: 1.02,
  },
} as const;

// Helper functions para acessar tokens
export const getColor = (mode: "light" | "dark", path: string): string => {
  const parts = path.split(".");
  let value: any = designTokens.colors[mode];
  
  for (const part of parts) {
    value = value?.[part];
  }
  
  return value || "";
};

export const getSpacing = (size: keyof typeof designTokens.global.spacing): string => {
  return designTokens.global.spacing[size];
};

export const getRadius = (size: keyof typeof designTokens.global.radius): string => {
  return designTokens.global.radius[size];
};

export const getFontSize = (size: keyof typeof designTokens.global.font.size): string => {
  return designTokens.global.font.size[size];
};

export const getFontWeight = (weight: keyof typeof designTokens.global.font.weight): number => {
  return designTokens.global.font.weight[weight];
};

// Export types
export type DesignTokens = typeof designTokens;
export type ColorMode = "light" | "dark";

