/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ["./*.html"],
  theme: {
    screens:{
      "md" : "720px",
      "lg" : "950px",
      "xl" : "1160px"
    },

    extend: {

      colors: {

        "primary-300": "hsl(35, 77%, 62%)",
        "primary-400": "hsl(5, 85%, 63%)",
        "neutral-200": "hsl(36, 100%, 99%)",
        "neutral-300": "hsl(233, 8%, 79%)",
        "neutral-400": "hsl(236, 13%, 42%)",
        "neutral-900": "hsl(240, 100%, 5%)",
      },

      fontFamily: {
        main : ["Inter", "sans-serif"]
      }
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        html: { fontSize: "15px" },
      });
    }),
  ],
};
