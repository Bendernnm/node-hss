console.log(process.cwd());

const { StaticServer } = require('../');

const staticServer = StaticServer.setup().startServer();

staticServer.on('serverRequest', ({ url }) => console.log(`Request: ${url}`));

staticServer.on('serverWarning', (data) => console.log('Server warning.', data));
staticServer.on('serverError', (err) => console.error('Server error.', err));

staticServer.on('serverStart', () => console.log(`Server started on - http://${staticServer.host}:${staticServer.port}`));
staticServer.on('serverStop', () => console.log('Server stopped'));
staticServer.on('serverRestart', () => console.log('Server restarted'));

staticServer.on('streamError', (err) => console.error('Stream error', err));

// server control
// setTimeout(() => {
//   console.log('timeout1');
//   staticServer.once('serverStop', () => {
//     console.log('timeout2');
//     setTimeout(() => staticServer.startServer(), 15000);
//   });
//
//   staticServer.stopServer();
// }, 5000);
//
//
// setTimeout(() => {
//   console.log('timeout3');
//   staticServer.restartServer();
// }, 50000);
//
// setTimeout(() => {
// }, 100000);
