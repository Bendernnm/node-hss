const fs = require('fs');
const http = require('http');
const path = require('path');
const { EventEmitter } = require('events');

const mime = require('mime');

function errorResponse(res, { msg, headers, statusCode }) {
  res.writeHead(statusCode, headers);
  msg && res.write(Buffer.from(JSON.stringify({ msg })));

  return res;
}

class Server extends EventEmitter {
  constructor(opts = { path: 'public' }) {
    super();

    if (typeof opts === 'string') {
      opts = { path: opts };
    }

    if (typeof opts.path !== 'string') {
      throw new Error('Wrong path. Path must be a string!');
    }

    if (opts.host && typeof opts.host !== 'string') {
      throw new Error('Host must be a string.');
    }

    if (opts.port && typeof opts.port !== 'number') {
      throw new Error('Port must be a number.');
    }

    this.path = opts.path;
    this.port = opts.port || 4040;
    this.host = opts.host || 'localhost';
    this.staticPath = path.join(process.cwd(), this.path);
  }

  // server control block
  stopServer() {
    if (!this.server) {
      return;
    }

    this.server.close();

    return this;
  }

  restartServer() {
    if (!this.server) {
      return;
    }

    this.once('serverStop', () => {
      this.startServer();
      this.emit('serverRestart');
    });
    this.stopServer();

    return this;
  }

  startServer() {
    this.server = http.createServer((req, res) => {
      const url = req.url;

      setImmediate(() => this.emit('serverRequest', { url }));

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        setImmediate(() => this.emit('serverWarning', { method: req.method, msg: 'Wrong method' }));

        return errorResponse(res, { statusCode: 405, headers: { Allow: 'GET, HEAD', 'Content-Length': '0' } }).end();
      }

      const fileName = url === '/' ? '/index.html' : url;
      const filePath = path.join(this.staticPath, fileName);
      const fileExtension = path.extname(fileName).substring(1);
      const fileMimeType = mime.getType(fileExtension);

      if (!fileMimeType) {
        setImmediate(() => this.emit('serverWarning', { msg: 'Not allowed file\'s format' }));

        return errorResponse(res, {
          statusCode: 400,
          headers   : { 'Content-Length': '0' },
          msg       : 'Not allowed file\'s format',
        }).end();
      }

      if (!filePath.startsWith(this.staticPath)) {
        setImmediate(() => this.emit('serverWarning', { msg: 'File not found' }));

        return errorResponse(res, {
          statusCode: 404,
          headers   : { 'Content-Length': '0' },
          msg       : 'File not found',
        }).end();
      }

      res.writeHead(200, { 'Content-Type': fileMimeType });

      const stream = fs.createReadStream(filePath);

      stream.on('error', (err) => {
        setImmediate(() => this.emit('streamError', err));

        errorResponse(res, {
          statusCode: 404,
          headers   : { 'Content-Type': 'application/json' },
          msg       : 'File not found',
        }).end();
      });

      stream.pipe(res);
    });

    this.server.on('error', (err) => this.emit('serverError', err));
    this.server.on('listening', () => this.emit('serverStart', { host: this.host, port: this.port }));
    this.server.on('close', () => {
      // console.log('CLOSE EVENT!!!');
      this.emit('serverStop');
      this.server = null;
    });

    this.server.listen(this.port, this.host);

    return this;
  }

  // static methods
  static setup(opts) {
    return new Server(opts);
  }
}

module.exports = Server;
