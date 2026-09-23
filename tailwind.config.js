/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0D1B34",
          soft: "#4A5C7E",
          muted: "#5B6B8C",
          faint: "#6B7C9C",
          light: "#8392AE",
        },
        primary: {
          DEFAULT: "#2B5BE2",
          dark: "#1D3FAF",
          darker: "#16307A",
        },
        bg: {
          app: "#E7ECF6",
          screen: "#F2F5FB",
          soft: "#F7F9FD",
        },
        chip: "#E4EAF6",
        line: "rgba(13,27,52,.08)",
        status: {
          interest: "#1D3FAF",
          interestBg: "#E8EEFD",
          visit: "#0A7590",
          visitBg: "#E1F5F9",
          visited: "#5B37C4",
          visitedBg: "#EEE9FC",
          contract: "#0B7355",
          contractBg: "#E2F6EF",
        },
        tag: {
          cyan: "#0E8FB0",
          cyanBg: "#E1F5F9",
          violet: "#6B48D6",
          violetBg: "#EEE9FC",
          amber: "#B26A0B",
          amberBg: "#FBF0DC",
          green: "#0B7355",
          greenBg: "#E2F6EF",
        },
      },
      fontFamily: {
        sans: [
          "'Pretendard Variable'",
          "Pretendard",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 10px 24px -16px rgba(13,27,52,.35)",
        cta: "0 14px 26px -14px rgba(29,63,175,.9)",
        sheet: "0 -18px 40px -20px rgba(11,23,48,.5)",
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "none" },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "rise-in": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "none" },
        },
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(250%)" },
        },
      },
      animation: {
        "slide-up": "slide-up .28s cubic-bezier(.2,.8,.3,1) both",
        "fade-in": "fade-in .2s ease both",
        "rise-in": "rise-in .3s ease both",
        "progress-indeterminate": "progress-indeterminate 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
