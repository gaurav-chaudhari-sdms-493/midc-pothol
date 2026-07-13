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
        govBlue: {
          DEFAULT: '#005bb5',
          light: '#337bca',
          dark: '#004080',
        },
        accent: {
          orange: '#f97316', // Tailwind orange-500
        },
        status: {
          success: '#22c55e', // Green
          warning: '#f59e0b', // Amber
          danger: '#ef4444', // Red
          info: '#3b82f6', // Blue
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
