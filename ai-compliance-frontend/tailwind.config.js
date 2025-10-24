/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#3b82f6",        // Blue
          "secondary": "#8b5cf6",      // Purple
          "accent": "#f59e0b",         // Amber
          "neutral": "#374151",        // Gray
          "base-100": "#ffffff",       // White background
          "base-200": "#f9fafb",       // Very light gray
          "base-300": "#f3f4f6",       // Light gray
          "info": "#3b82f6",           // Blue
          "success": "#10b981",        // Green
          "warning": "#f59e0b",        // Amber
          "error": "#ef4444",          // Red
        },
      },
    ],
    darkTheme: false, // Disable dark theme
    base: true,
    styled: true,
    utils: true,
  },
}





