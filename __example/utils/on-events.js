module.exports = (staticServer, EVENTS) => {
  staticServer.on(EVENTS.SERVER_REQUEST, ({ url }) => console.log(`Request: ${url}`));

  staticServer.on(EVENTS.SERVER_WARNING, (data) => console.log('Server warning.', data));
  staticServer.on(EVENTS.SERVER_ERROR, (err) => console.error('Server error.', err));

  staticServer.on(EVENTS.SERVER_START, () => console.log(`Server started on - http://${staticServer.host}:${staticServer.port}`));
  staticServer.on(EVENTS.SERVER_STOP, () => console.log('Server stopped'));
  staticServer.on(EVENTS.SERVER_RESTART, () => console.log('Server restarted'));

  staticServer.on(EVENTS.STREAM_ERROR, (err) => console.error('Stream error', err));
};
