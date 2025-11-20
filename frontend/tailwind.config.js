/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // GearLog Design System Colors
        border: "var(--gearlog-border)",
        input: "var(--gearlog-input-bg)",
        ring: "var(--gearlog-accent-primary)",
        background: "var(--gearlog-background)",
        foreground: "var(--gearlog-text-primary)",
        primary: {
          DEFAULT: "var(--gearlog-accent-primary)",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "var(--gearlog-accent-secondary)",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "var(--gearlog-danger)",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "var(--gearlog-text-muted)",
          foreground: "var(--gearlog-text-secondary)",
        },
        accent: {
          DEFAULT: "var(--gearlog-accent-primary)",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "var(--gearlog-surface)",
          foreground: "var(--gearlog-text-primary)",
        },
        card: {
          DEFAULT: "var(--gearlog-surface)",
          foreground: "var(--gearlog-text-primary)",
        },
        success: "var(--gearlog-success)",
        warning: "var(--gearlog-warning)",
        danger: "var(--gearlog-danger)",
        surface: {
          DEFAULT: "var(--gearlog-surface)",
          alt: "var(--gearlog-surface-alt)",
        },
        text: {
          primary: "var(--gearlog-text-primary)",
          secondary: "var(--gearlog-text-secondary)",
          muted: "var(--gearlog-text-muted)",
        },
      },
      borderRadius: {
        xs: "var(--gearlog-radius-xs)",
        sm: "var(--gearlog-radius-sm)",
        md: "var(--gearlog-radius-md)",
        lg: "var(--gearlog-radius-lg)",
        xl: "var(--gearlog-radius-xl)",
        full: "var(--gearlog-radius-full)",
      },
      spacing: {
        xs: "var(--gearlog-spacing-xs)",
        sm: "var(--gearlog-spacing-sm)",
        md: "var(--gearlog-spacing-md)",
        lg: "var(--gearlog-spacing-lg)",
        xl: "var(--gearlog-spacing-xl)",
      },
      fontFamily: {
        primary: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: "var(--gearlog-font-size-xs)",
        sm: "var(--gearlog-font-size-sm)",
        md: "var(--gearlog-font-size-md)",
        lg: "var(--gearlog-font-size-lg)",
        xl: "var(--gearlog-font-size-xl)",
        xxl: "var(--gearlog-font-size-xxl)",
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      boxShadow: {
        card: "var(--gearlog-shadow-card)",
      },
      transitionDuration: {
        default: "150ms",
      },
      transitionTimingFunction: {
        default: "ease-in-out",
      },
      scale: {
        hover: "1.02",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

