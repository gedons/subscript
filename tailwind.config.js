/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Update this to include the paths to all of your component files.
    content: ["./App.{js,jsx,ts,tsx}", "./screens/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                navy: {
                    DEFAULT: "#0A192F",
                    dark: "#081221",
                },
                teal: {
                    DEFAULT: "#14C6B2",
                    light: "#1EE1CB",
                },
            },
            fontFamily: {
                jakarta: ["PlusJakartaSans_400Regular"],
                "jakarta-medium": ["PlusJakartaSans_500Medium"],
                "jakarta-bold": ["PlusJakartaSans_700Bold"],
                "jakarta-extrabold": ["PlusJakartaSans_800ExtraBold"],
                inter: ["Inter_400Regular"],
                "inter-medium": ["Inter_500Medium"],
                "inter-bold": ["Inter_700Bold"],
            },
        },
    },
    plugins: [],
};
