const { onEvents } = require('./utils');

const { CONSTANTS, StaticServer } = require('../');

const staticServer = StaticServer.setup({
  path                    : 'public',
  port                    : 4040,
  host                    : '127.0.0.1',
  useCache                : 1,
  showDirectoriesStructure: 1,
  cacheOpts               : {
    maxSizeOfCache     : 1024 * 1024 * 50, // required, bytes
    maxSizeOfCachedFile: 1024 * 1024 * 5, // required, bytes
  },
}).startServer();

onEvents(staticServer, CONSTANTS.EVENTS);
