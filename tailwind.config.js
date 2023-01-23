/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        default: ["Azeret Mono", "monospace"],
        card: ["Inter", "sans-serif"],
      },
      borderRadius: {
        'card-inner': "50%"
      },
      rotate: {
        'card-angle': "24deg",
        'card-back-angle': "40deg"
      }
    },
    colors: {
      background: "#171819",
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
