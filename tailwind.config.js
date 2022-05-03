module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],   
  mode: 'jit',
  theme: {
    colors: {
      'white': '#ffffff',
      'black': '#000000',
      'primary': {
        500: '#4B9ECD',
        600: '#24699D',
      },
    },
  },
  plugins: [],
  variants: {
    extend: {}
  }
}