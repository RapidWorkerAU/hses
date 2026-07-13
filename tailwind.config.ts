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
        accent: {
          50:  "#f0faf9",
          500: "#2d9692",
          600: "#267f7a",
        },
        danger: {
          500: "#ef4444",
          600: "#dc2626",
        },
        success: {
          600: "#16a34a",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
