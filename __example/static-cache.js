const { onEvents } = require('./utils');

const { CONSTANTS, StaticServer } = require('../');

const staticServer = StaticServer.setup({
  path      : 'public',
  port      : 4040,
  host      : '127.0.0.1',
  useCache  : 1,
  cacheOpts : {
    maxSizeOfCache: 12, // required, bytes
    maxSizeOfCachedFile: 10, // required, bytes
  },
}).startServer();

onEvents(staticServer, CONSTANTS.EVENTS);
