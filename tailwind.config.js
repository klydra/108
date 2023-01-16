/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        'card-inner': "50%"
      }
    },
    colors: {
      background: "#171819",
      'card-yellow': "#FDFFB6",
      'card-green': "#CAFFBF",
      'card-blue': "#9BF6FF",
      'card-purple': "#BDB2FF",
      'card-accent': "#f2f2f2"
    },
  },
  plugins: [],
}
