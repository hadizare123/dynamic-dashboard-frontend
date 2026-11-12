/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#17151C',
          surface: '#201D27',
          border: '#292531',
          muted: '#45404F',
        },
        brand: {
          primary: '#A855F7',
          accent: '#EC4899',
          cyan: '#06B6D4',
        }
      }
    },
  },
  plugins: [],
}
