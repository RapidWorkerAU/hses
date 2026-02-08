import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f1a",
        slate: "#1f2937",
        ocean: "#0d5c75",
        mist: "#f5f2eb",
      },
    },
  },
  plugins: [],
} satisfies Config;
