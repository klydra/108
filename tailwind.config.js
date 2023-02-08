/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        card: ["Azeret Mono", "monospace"],
        default: ["Inter", "sans-serif"],
      },
      borderRadius: {
        'card-inner': "50%"
      },
      rotate: {
        'card-angle': "30deg",
        'card-back-angle': "40deg"
      }
    },
    colors: {
      background: "#171819",
      signature: "#FFA071",
      'card-yellow': "#FDFFB6",
      'card-green': "#CAFFBF",
      'card-blue': "#9BF6FF",
      'card-purple': "#BDB2FF",
      'card-accent': "#F2F2F2",
      'card-back': "#000000",
      'card-back-text': "#1C18F0",
      'table-background': "#666666"
    },
  },
  plugins: [],
}
