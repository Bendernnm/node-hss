module.exports = function ({ msg, headers = {}, statusCode }, end = true) {
  this.writeHead(statusCode, headers);

  if (msg) {
    let payload = msg;

    if (headers['Content-Type'] === 'application/json') {
      try {
        payload = JSON.stringify({ msg });
      } catch (err) {
        throw new Error('Incorrect payload.');
      }
    }

    this.write(Buffer.from(payload));
  }

  if (end) {
    return this.end();
  }

  return this;
};
