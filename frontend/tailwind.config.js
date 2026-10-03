/** @type {import('tailwindcss').Config} */

// Tokeny opisane w docs/design_system.md. Nadpisujemy skale slate/blue/indigo,
// żeby wszystkie istniejące widoki dziedziczyły paletę regionu bez przepisywania klas.
const kamien = {
  50: '#F5F6F3',
  100: '#ECEEEA',
  200: '#DCE0DE',
  300: '#C3C9CB',
  400: '#8E97A0',
  500: '#5C6673',
  600: '#485160',
  700: '#343D4B',
  800: '#232C3A',
  900: '#17233A',
  950: '#0E1726'
};

const niebieski = {
  50: '#EEF4FB',
  100: '#D9E6F6',
  200: '#BCD0EA',
  300: '#86ABDA',
  400: '#4F85C6',
  500: '#2266B4',
  600: '#034EA2',
  700: '#023F84',
  800: '#033268',
  900: '#06264D',
  950: '#061A33'
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: kamien,
        blue: niebieski,
        indigo: niebieski,
        violet: niebieski,
        purple: niebieski,
        amber: {
          300: '#FFE066',
          400: '#FFD100'
        },
        malopolska: {
          paper: '#F5F6F3',
          ink: '#17233A',
          blue: '#034EA2',
          yellow: '#FFD100',
          rule: '#BCD0EA',
          margin: '#C8102E',
          forest: '#2F6B4F',
          // dawne nazwy, zachowane dla zgodności
          lightBlue: '#4F85C6',
          darkBlue: '#17233A',
          slate: '#F5F6F3'
        }
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible Next"', '"Atkinson Hyperlegible"', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '5px',
        lg: '6px',
        xl: '8px',
        '2xl': '10px',
        '3xl': '12px'
      },
      boxShadow: {
        xs: '0 1px 0 rgb(23 35 58 / 0.05)',
        sm: '0 1px 2px rgb(23 35 58 / 0.06)',
        DEFAULT: '0 1px 3px rgb(23 35 58 / 0.08)',
        md: '0 2px 6px -1px rgb(23 35 58 / 0.10)',
        lg: '0 6px 16px -6px rgb(23 35 58 / 0.16)',
        xl: '0 10px 24px -10px rgb(23 35 58 / 0.20)',
        '2xl': '0 14px 32px -12px rgb(23 35 58 / 0.24)',
        card: '0 1px 0 #DCE0DE, 0 18px 40px -18px rgb(23 35 58 / 0.35)'
      }
    },
  },
  plugins: [],
}
