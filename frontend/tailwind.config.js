/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        malopolska: {
          blue: '#034EA2',
          lightBlue: '#00A3E0',
          yellow: '#FFD100',
          darkBlue: '#0A2540',
          slate: '#F4F7FB'
        }
      }
    },
  },
  plugins: [],
}
