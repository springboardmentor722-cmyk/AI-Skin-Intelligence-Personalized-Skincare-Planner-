/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        porcelain: {
          DEFAULT: "#FBF7F1",
          deep: "#F3EBDD",
        },
        ink: {
          DEFAULT: "#15211D",
          soft: "#4A5650",
          faint: "#8B9490",
        },
        teal: {
          50: "#E9F2EE",
          100: "#D3E6DE",
          200: "#A8CDBC",
          300: "#7CB49B",
          400: "#4B9179",
          500: "#1F6F5C",
          600: "#195A4A",
          700: "#15493D",
          800: "#0F362D",
          900: "#0A241E",
        },
        rose: {
          50: "#FDF0F2",
          100: "#FBE1E6",
          200: "#F3BAC4",
          300: "#EA93A3",
          400: "#E1728A",
          500: "#D65472",
          600: "#B93E5B",
          700: "#96324A",
        },
        gold: {
          50: "#FAF3E6",
          100: "#F3E3C2",
          300: "#DDB877",
          400: "#C89B4A",
          500: "#AD8038",
          600: "#8C6529",
        },
        stone: {
          100: "#F3EEE5",
          200: "#E4DBC9",
          300: "#DAD2C4",
          400: "#B9AD97",
        },
        // Aliases so existing bg-brand-*/text-sage-* utility classes across
        // the app resolve to the new palette without touching every file.
        brand: {
          50: "#E9F2EE", 100: "#D3E6DE", 200: "#A8CDBC", 300: "#7CB49B",
          400: "#4B9179", 500: "#1F6F5C", 600: "#195A4A", 700: "#15493D", 800: "#0F362D", 900: "#0A241E",
        },
        sage: {
          50: "#F1F5ED", 100: "#E1EBD9", 200: "#C3D7B2", 300: "#A0C088",
          400: "#7EA863", 500: "#5C8F4C", 600: "#4A7440", 700: "#3C5E35",
        },
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 16px -4px rgba(21, 33, 29, 0.08)",
        lifted: "0 12px 40px -12px rgba(21, 33, 29, 0.22)",
      },
      keyframes: {
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "spin-reverse-slow": { to: { transform: "rotate(-360deg)" } },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 18s linear infinite",
        "spin-reverse-slow": "spin-reverse-slow 24s linear infinite",
        float: "float 5s ease-in-out infinite",
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
}

