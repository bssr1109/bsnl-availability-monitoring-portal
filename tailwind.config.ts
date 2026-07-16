import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        bsnl: "#0967a8",
        alert: "#c2410c"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(21, 32, 52, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
