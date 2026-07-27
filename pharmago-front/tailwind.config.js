/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fbf4',
          100: '#dbf5e3',
          200: '#b8eaca',
          300: '#87d9a9',
          400: '#4fbf82',
          500: '#28a463',
          600: '#1a854e',
          700: '#166a41',
          800: '#155437',
          900: '#12452f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Poppins"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(18, 69, 47, 0.08)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
