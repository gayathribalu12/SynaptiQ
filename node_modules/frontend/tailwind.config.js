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
        dark: {
          bg: '#0A0E1A',
          card: '#121A2E',
          border: '#1E2D4A',
          text: '#F3F4F6'
        },
        primary: {
          light: '#60A5FA',
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          neural: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(59, 130, 246, 0.3)',
        'neon-purple': '0 0 15px rgba(139, 92, 246, 0.3)',
        'neon-green': '0 0 15px rgba(16, 185, 129, 0.3)',
      }
    },
  },
  plugins: [],
}
