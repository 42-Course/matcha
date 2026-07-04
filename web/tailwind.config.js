/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        typing: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        'fade-in': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'slide-out-right': 'slide-out-right 0.3s ease-in forwards',
        typing: 'typing 2s steps(30, end)',
        'fade-in': 'fade-in 1.2s ease-in-out',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        primary: '#646cff',
        background: '#121212',
        // Matcha friends palette — warm, organic, grounded in the tea the app is named for.
        matcha: {
          50: '#f4f7ee',
          100: '#e6eed7',
          200: '#cddcb2',
          300: '#aac484',
          400: '#88a95f',
          500: '#6b8e4e',
          600: '#547239',
          700: '#425a31',
          800: '#37492b',
          900: '#2f3d26',
        },
        clay: '#d98a5b',
      },
    },
  },
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

