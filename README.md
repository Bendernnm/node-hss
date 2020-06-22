# Node - HTTP static server

## Install

```jsx
npm install --save node-shh
```

## Description

Simple server static. Wrote on native Node.js!

It would be good a point for you if you need a fast setup server to provide access to the public files. I recommend using this package only for the development process, no for production.

Why this library, no something else? Cause only here you can found powerful features that help you in development way (at least create static server) and we proud of the stability and performance of our product.

## Features

## Simple use

If you haven't enough time for reading a lot of instructions or chief annoying you with phrases like this one: - 'Just do it! And faster please!' Just do this simple steps:

1. Install

    ```jsx
    npm install node-shh
    ```

2. Create *server.js* file and put this code here:

    ```jsx
    const { StaticServer } = require('node-shh');

    StaticServer.setup().startServer();
    ```

3. Create `public` folder at the same level as the server.js file. 

4. Put several files for sharing to the `public` folder. For starting to create the `index.htm` and `text.txt` ;)

5. Launch the browser and go to `http://127.0.0.1:4040`. Then you can choose any file in your folder for sharing, for example - `http://127.0.0.1:4040/text.txt`.

## Features

- Cache functionality (simple/watcher)
- Possibility to handle errors
- Setup custom server config
- Pass different headers
- Download files
- Show directories structure

## Examples

Check more examples in __examples folder

## Plans for future

- [ ]  Use default util - pipeline
- [ ]  Templates issue
- [ ]  Rename Cache to CacheStorage
- [ ]  Cover the project with tests
- [ ]  Write article
- [x]  Push last changes
- [x]  Push to npm

## Issues & bugs

Feel free to connect with me and notify about all weak parts that you found. You can create an issue on GitHub.

*More soon...*
