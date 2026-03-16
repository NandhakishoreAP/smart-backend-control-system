/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        body: ["IBM Plex Sans", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          900: "#0b0f19",
          800: "#121826",
          700: "#1a2234",
          600: "#2a3245",
        },
        fog: {
          50: "#f5f7fb",
          100: "#e8edf6",
          200: "#cfd9ea",
        },
        signal: {
          600: "#d97706",
          500: "#f59e0b",
          400: "#fbbf24",
        },
        mint: {
          600: "#0f766e",
          500: "#14b8a6",
          400: "#2dd4bf",
        },
      },
      boxShadow: {
        glass: "0 20px 60px -30px rgba(15, 23, 42, 0.55)",
      },
    },
  },
  plugins: [],
}

