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
        serif: ["var(--font-literata)", "Palatino", "Georgia", "serif"],
      },
      colors: {
        // Color shortcuts
        magnolia: "var(--magnolia)",
        dun: "var(--dun)",
        battleship: "var(--battleship-gray)",
        walnut: "var(--walnut-brown)",
        vandyke: "var(--van-dyke)",
      },
      animation: {
        "page-turn": "pageTurn 0.5s ease-out",
        "page-appear": "pageAppear 0.5s ease-out forwards",
        "pulse-soft": "pulse 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;