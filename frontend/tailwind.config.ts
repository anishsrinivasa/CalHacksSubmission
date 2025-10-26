import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Theme - Vercel Style
        govtech: {
          'bg': '#000000',             // Pure black background
          'card': '#0a0a0a',           // Very dark gray cards
          'primary': '#ffffff',        // White for primary elements
          'primary-hover': '#e5e5e5',  // Slightly dimmed white on hover
          'secondary': '#3b82f6',      // Blue accent
          'text-primary': '#ffffff',   // White text
          'text-secondary': '#a1a1aa', // Light gray text
          'text-muted': '#71717a',     // Muted gray text
          'border': '#27272a',         // Dark border
        },
        // Unified severity colors
        severity: {
          'critical': '#ef4444',       // Bright red
          'high': '#f59e0b',           // Amber
          'medium': '#3b82f6',         // Blue
          'low': '#10b981',            // Green
        }
      },
    },
  },
  plugins: [],
};

export default config;
