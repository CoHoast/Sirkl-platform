import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // DOKit Brand Colors
        primary: {
          DEFAULT: '#0a0f1a',  // Dark blue/black
          dark: '#060912',
          light: '#1a2332',
        },
        accent: {
          DEFAULT: '#00d4ff',  // Bright cyan
          light: '#4de4ff',
          dark: '#00b8e6',
        },
        secondary: {
          DEFAULT: '#00ffcc',  // Turquoise/mint
          light: '#4dffe0',
          dark: '#00d9ad',
        },
        slate: {
          DEFAULT: '#2a3443',
          light: '#3d4a5c',
        },
        cream: '#f8fafc',      // Light background
        'warm-white': '#ffffff',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px rgba(0,0,0,0.04)',
        'soft-md': '0 4px 24px rgba(0,0,0,0.06)',
        'soft-lg': '0 12px 48px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
export default config;
