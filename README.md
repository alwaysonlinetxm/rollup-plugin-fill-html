# rollup-plugin-fill-html

Fill the html template with the bundle js..

## Installation

    yarn add --dev rollup-plugin-fill-html
    
or 

    npm install -D rollup-plugin-fill-html
    
## Usage

In the rollup.config.js:

```JavaScript
import html from 'rollup-plugin-fill-html';

export default {
  entry: 'src/index.js',
  dest: 'dist/bundle.js',
  plugins: [
    html({
      template: 'src/index.html',
      filename: 'index.html'
    })
  ]
};
```
and then a index.html file will be created in the dest directory(where the bundle file will be).

## Options

You can pass an option to the `html()` just like above, and there are some options:

- template: Required. the path of the template file, it should be a html file.
- filename: Optional. the name of the result html file, if omitted, the template name will be used.
- format: Optional. when the rollup.config.js use field 'target', then you need to set the format to choose which bundle should be inserted into the result file.

demo:

```JavaScript
// rollup.config.js
import html from 'rollup-plugin-fill-html';

export default {
  entry: 'src/index.js',
  target: [
    { format: 'cjs', dest: 'dist/index.cjs.js' },
    { format: 'es', dest: 'dist/index.es.js' }
  ],
  plugins: [
    html({
      template: 'src/index.html',
      filename: 'index.html',
      format: 'es'
    })
  ]
};
```

then the `dist/index.es.js` will be inserted into the result file.

## License

MIT
