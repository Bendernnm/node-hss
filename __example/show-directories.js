const { onEvents } = require('./utils');

const { CONSTANTS, StaticServer } = require('../');

const staticServer = StaticServer.setup({
  path                    : 'public',
  port                    : 4040,
  host                    : '127.0.0.1',
  showDirectoriesStructure: true,
}).startServer();

onEvents(staticServer, CONSTANTS.EVENTS);
