/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#39FF14',
                'primary-hover': '#4aff2d',
                black: '#020202',
                dark: '#0a0a0a',
                darker: '#111111',
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            animation: {
                'spin-slow': 'spin 1s linear infinite',
                'bounce-slow': 'bounce 1s infinite',
            },
        },
    },
    plugins: [],
}
