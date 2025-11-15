// 💡 Add this line at the very top of the file
const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // ... your existing content paths
  ],
  theme: {
    extend: {
      colors: {
        // 💡 This line re-adds the slate colors to your theme
        slate: colors.slate,
        // Make sure to add any other custom colors you use
      },
    },
  },
  plugins: [],
}