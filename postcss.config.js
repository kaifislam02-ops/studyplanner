module.exports = {
  plugins: {
    // 💡 Replace the OLD 'tailwindcss' with the new '@tailwindcss/postcss'
    '@tailwindcss/postcss': {}, 
    autoprefixer: {}, // Make sure to keep 'autoprefixer' if it was there
  },
};