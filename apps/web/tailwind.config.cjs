module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        mono: {
          0: "#ffffff",
          50: "#f7f7f7",
          100: "#ededed",
          200: "#d9d9d9",
          300: "#c4c4c4",
          400: "#9e9e9e",
          500: "#7e7e7e",
          600: "#5f5f5f",
          700: "#3f3f3f",
          800: "#262626",
          900: "#111111",
          1000: "#000000",
        },
      },
    },
  },
  plugins: [],
};
