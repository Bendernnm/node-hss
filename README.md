# Node - HTTP static server

## Install

```jsx
npm install --save node-hss
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
    npm install package-name
    ```

2. Create *server.js* file and put this code here:

    ```jsx
    const { StaticServer } = require('package-name');

    StaticServer.setup().startServer();
    ```

3. Then create public folder in the same level to the server.js file. And put several files for sharing. Like in this amazing picture:

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
- [ ]  Rename Cache to CacheStorage
- [ ]  Cover the project with tests
- [ ]  Write article
- [x]  Push last changes
- [x]  Push to npm

## Issues & bugs

Feel free to connect with me and notify about all weak parts that you found. You can create an issue on GitHub.

*More soon...*
