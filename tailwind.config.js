/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#7B2CBF",
                secondary: "#48CAE4",
                green: "#2EBD59",
                red: "#FF0000",
                yellow: "#FFC107",
                red: "#FF0000",
                gray: "#F9F9F9",
                dark: "#111827",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
            }

        },
    },
    plugins: [],
};
