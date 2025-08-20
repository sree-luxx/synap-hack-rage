/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-purple': '#C300FF',
        'neon-purple-dark': '#A100D6',
        'neon-blue': '#00D1FF',
        'neon-pink': '#FF00E6',
        'neon-green': '#00FF88',
        'neon-orange': '#FF8800',
        'gray-text': '#B0B0B0',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'montserrat': ['Montserrat', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};