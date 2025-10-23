/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#2563eb',
        secondary: '#1d4ed8',
        bg: '#f9fafb',
        card: '#ffffff',
        border: '#e5e7eb',
        text: '#111827',
        muted: '#6b7280',
      },
    },
  },
  plugins: [],
};
