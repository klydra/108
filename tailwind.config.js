/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        card: ["Azeret Mono", "monospace"],
        default: ["Inter", "sans-serif"],
      },
      borderRadius: {
        "card-inner": "50%",
      },
      rotate: {
        "card-angle": "30deg",
        "card-back-angle": "60deg",
      },
      strokeWidth: {
        "card-block-outer": "5rem",
        "card-block-inner": "7rem",
        "card-direction-outer": "4rem",
        "card-icon-outer": "1rem",
        "card-icon-inner": "2.5rem",
        "card-icon-border": "0.8rem",
      },
    },
    colors: {
      background: "#1A1B1E",
      signature: "#FFA071",
      "card-yellow": "#FDFFB6",
      "card-green": "#CAFFBF",
      "card-blue": "#9BF6FF",
      "card-purple": "#BDB2FF",
      "card-symbol": "#050505",
      "card-accent": "#F2F2F2",
      "card-inner": "#FFFFFF",
      "card-back": "#000000",
      "card-back-text": "#1C18F0",
      "table-background": "#666666",
      contrast: "#FFFFFF",
    },
  },
  plugins: [],
};
