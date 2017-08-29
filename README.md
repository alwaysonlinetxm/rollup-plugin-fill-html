# rollup-plugin-fill-html

Fill the html template with the bundle js..

## Note

The 1.0.3 version has been supported to insert css file and external url, you should know that rollup-plugin-fill-html will scan the dest directory and find out the bundl js and `all the css files`, and then into the result html. So you'd better to clean the dest directory before rebuilding, and I think you may need [this](https://github.com/alwaysonlinetxm/rollup-plugin-clean) .

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

## Hash

With `rollup-plugin-fill-html`, you can set a format string which with '[hash]' for the dest in rollup.config.js, just like:

```JavaScript
export default {
  entry: 'src/index.js',
  dest: 'dist/bundle-[hash].js',
  plugins: [
    ...
  ]
};
```

and then, you will get `bundle-a3965c0c77a63d7c74b57222e2f74028.js` in your dist directory.

## Options

You can pass an option to the `html()` just like above, and there are some options:

- template: Required. the path of the template file, it should be a html file.
- filename: Optional. the name of the result html file, if omitted, the template name will be used.
- externals: Optional. a list of files which will be insert into the resule html. The file should be a valid url.


demo:

```JavaScript
// rollup.config.js
import html from 'rollup-plugin-fill-html';

export default {
  entry: 'src/index.js',
  dest: 'dist/bundle.js',,
  plugins: [
    html({
      template: 'src/index.html',
      filename: 'index.html',
      externals: [
        // the type can be 'js' or 'css', 
        // and you can pass a pos feild to control the the position in which the file will be inserted.
        // the xxxx1.js will be inserted before the bundle, 
        // and the xxxx2.js will be inserted after the bundle as default
        { type: 'js', file: '//xxxx1.js', pos: 'before' },
        { type: 'js', file: '//xxxx2.js' }
      ]
    })
  ]
};
```

then the `dist/bundle.js` will be inserted into the result file.

## License

MIT
