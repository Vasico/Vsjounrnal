module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Playfair Display'", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      colors: {
        night: "#0f1419",
        smoke: "#1c242c",
        accent: "#00e0b8"
      }
    }
  },
  plugins: []
};
