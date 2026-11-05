/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FAF6EA',
          100: '#F3EBD6',
          200: '#E8DCBB',
          300: '#D6C595',
        },
        leaf: {
          50: '#EEF4EF',
          100: '#D8E7DB',
          500: '#4E7D5B',
          600: '#3E6B4B',
          700: '#2E5239',
        },
      },
    },
  },
  plugins: [],
};
