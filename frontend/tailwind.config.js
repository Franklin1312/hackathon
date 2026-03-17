/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:  ['Jost', 'sans-serif'],
      },
      colors: {
        cream:  { DEFAULT:'#fefcf8', 2:'#f5f0e8', 3:'#f0e8d8' },
        forest: { DEFAULT:'#4a7c59', dark:'#2d5a3d', deep:'#1e3a27' },
        bark:   { DEFAULT:'#2d1f0e', 2:'#5c4a32', 3:'#8a7a65', 4:'#c8b99a' },
        parchment: '#e8d5b0',
        'amber-warm': '#8b6914',
        'civic-blue': '#2563a8',
      },
      borderRadius: { '2xl':'16px', '3xl':'24px' },
    },
  },
  plugins: [],
}
