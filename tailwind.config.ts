import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
        mono: ["Courier New", "monospace"],
      },
      colors: {
        kraft: {
          50: "#fdf8f0",
          100: "#f5e6c8",
          200: "#e8c98a",
          300: "#d4a855",
          400: "#b8832a",
          500: "#8b5e1a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
