import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--bg-base)",
                foreground: "var(--text-primary)",
                border: "var(--border-default)",
                input: "var(--border-default)",
                ring: "var(--primary-500)",
                primary: {
                    DEFAULT: "var(--primary-600)",
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "var(--slate-700)",
                    foreground: "#ffffff",
                },
                destructive: {
                    DEFAULT: "var(--error)",
                    foreground: "#ffffff",
                },
                muted: {
                    DEFAULT: "var(--slate-800)",
                    foreground: "var(--slate-400)",
                },
                accent: {
                    DEFAULT: "var(--slate-800)",
                    foreground: "var(--text-primary)",
                },
                card: {
                    DEFAULT: "var(--bg-surface)",
                    foreground: "var(--text-primary)",
                },
            },
            borderRadius: {
                lg: "var(--radius-lg)",
                md: "var(--radius-md)",
                sm: "var(--radius-sm)",
                xl: "var(--radius-xl)",
                "2xl": "var(--radius-2xl)",
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [],
};

export default config;
