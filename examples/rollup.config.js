import html from 'rollup-plugin-fill-html';

export default {
  entry: 'src/index.js',
  dest: 'dist/bundle-[hash].js',
  format: 'iife',
  plugins: [
    html({
      template: 'src/index.html',
      filename: 'index.html'
    })
  ]
};
