// postcss.config.js

module.exports = {
  plugins: {
    // THIS MUST BE 'tailwindcss', NOT '@tailwindcss/postcss'
    'tailwindcss': {}, 
    autoprefixer: {},
  },
};