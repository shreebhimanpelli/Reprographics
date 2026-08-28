/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        flame: {
          blue: "#0A456F",
          "blue-deep": "#073352",
          "blue-mid": "#0D5A8C",
          orange: "#F58220",
          "orange-flat": "#F78E1E",
          gold: "#FDB515",
          ivory: "#F7F3EB",
          paper: "#FFFCF6",
          ink: "#122433",
          muted: "#5C6B7A",
        },
        brand: {
          50: "#f3f7fa",
          100: "#e2ebf2",
          200: "#c5d6e4",
          300: "#8aadc4",
          400: "#4e7fa3",
          500: "#0A456F",
          600: "#0A456F",
          700: "#073352",
          800: "#05263d",
          900: "#041c2e",
          950: "#021018",
        },
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "Cambria",
          "Libre Baskerville",
          "Georgia",
          "Times New Roman",
          "serif",
        ],
        sans: [
          "var(--font-sans)",
          "Nunito Sans",
          "Avenir Next",
          "Avenir",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        module: "0 10px 30px -18px rgba(10, 69, 111, 0.28)",
        "module-lg": "0 22px 50px -24px rgba(10, 69, 111, 0.35)",
      },
      maxWidth: {
        page: "80rem",
      },
    },
  },
  plugins: [],
};
