/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1E3A5F',
          dark: '#14273E',
          light: '#284C7A'
        },
        greige: {
          DEFAULT: '#CFC8BE',
          light: '#E2DDD6',
          dark: '#B0A89C'
        },
        charcoal: {
          DEFAULT: '#374151',
          light: '#4B5563',
          dark: '#1F2937'
        },
        darkbg: {
          DEFAULT: '#141210',
          card: '#1C1917',
          hover: '#292524',
          border: '#292524'
        },
        brand: {
          green: '#10B981',
          red: '#EF4444',
          amber: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
};
