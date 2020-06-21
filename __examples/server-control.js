const { onEvents } = require('./utils');

const { CONSTANTS, StaticServer } = require('../');

const staticServer = StaticServer.setup({ path: 'public' }).startServer();

onEvents(staticServer, CONSTANTS.EVENTS);

// server control
setTimeout(() => {
  console.log('timeout1');
  staticServer.once('serverStop', () => {
    console.log('timeout2');
    setTimeout(() => staticServer.startServer(), 15000);
  });

  staticServer.stopServer();
}, 5000);


setTimeout(() => {
  console.log('timeout3');
  staticServer.restartServer();
}, 50000);

setTimeout(() => {
}, 100000);
