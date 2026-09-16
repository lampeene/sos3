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
          DEFAULT: '#08717e',
          dark: '#065a64',
        },
        secondary: {
          DEFAULT: '#f9be00',
        },
        brand: {
          grey: '#575756',
        },
      },
    },
  },
  plugins: [],
};
