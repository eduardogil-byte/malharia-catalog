/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          50: "#f7f7f3",
          100: "#efefe9",
          200: "#dbded6",
          300: "#c6cbbf",
          400: "#9eaa9d",
          500: "#6e7b71",
          600: "#536259",
          700: "#3e4d44",
          800: "#2d4035",
          900: "#22352b",
          950: "#192a21",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
        display: [
          '"Iowan Old Style"',
          '"Palatino Linotype"',
          "Palatino",
          "Georgia",
          "serif",
        ],
      },
      boxShadow: {
        soft: "0 16px 45px -30px rgb(25 42 33 / 0.25)",
        float: "0 22px 55px -30px rgb(25 42 33 / 0.32)",
      },
    },
  },
  plugins: [],
};
