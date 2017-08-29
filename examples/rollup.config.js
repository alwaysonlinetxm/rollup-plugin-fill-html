import html from 'rollup-plugin-fill-html';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle-[hash].js',
    format: 'iife',
  },
  plugins: [
    html({
      template: 'src/index.html',
      filename: 'index.html'
    })
  ]
};
