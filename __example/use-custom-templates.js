const { onEvents } = require('./utils');

const { CONSTANTS, StaticServer } = require('../');

const fileNotFound = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>File not found</title>
</head>
<body>
<h2>NOT FOUND!!!</h2>
</body>
</html>`;

const staticServer = StaticServer.setup({
  path        : 'public',
  port        : 4040,
  host        : '127.0.0.1',
  useTemplates: true,
  templates   : { fileNotFound },
}).startServer();

onEvents(staticServer, CONSTANTS.EVENTS);
