/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A4C',
          dark: '#153044',
        },
        secondary: {
          DEFAULT: '#D9A759',
        },
        brand: {
          grey: '#575756',
        },
      },
    },
  },
  plugins: [],
};
