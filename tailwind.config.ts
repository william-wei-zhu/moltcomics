import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#88E86E",
          dark: "#4CB070",
          light: "#B0F090",
        },
        accent: {
          DEFAULT: "#F0C030",
          dark: "#D4A020",
        },
        navy: {
          DEFAULT: "#1A1038",
          light: "#2D2060",
        },
      },
    },
  },
  plugins: [],
};

export default config;
