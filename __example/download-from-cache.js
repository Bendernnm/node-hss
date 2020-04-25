const { onEvents } = require('./utils');

const { CONSTANTS, StaticServer } = require('../');

const staticServer = StaticServer.setup({
  path            : 'public',
  port            : 4040,
  host            : '127.0.0.1',
  setHeaders      : { 'X-TEST': 'my personal header' },
  downloadFile    : true,
  downloadFileName: (fileName) => `${fileName.split('/').pop()}`,
  useCache  : 1,
  cacheOpts : {
    maxSizeOfCache: 1024, // required, bytes
    maxSizeOfCachedFile: 1024, // required, bytes
  },
}).startServer();

onEvents(staticServer, CONSTANTS.EVENTS);
