const fs = require('fs');
const URL = require('url');
const http = require('http');
const path = require('path');
const { EventEmitter } = require('events');

const mime = require('mime');

const CONSTANTS = require('./const');
const templates = require('./templates');
const FilesCache = require('./files-cache');
const { errorResponse } = require('./utils');

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

    // static folder opts
    this.path = opts.path;
    this.staticPath = path.join(process.cwd(), this.path);

    // server opts
    this.port = opts.port || 4040;
    this.host = opts.host || 'localhost';

    // default headers
    this.setHeaders = opts.setHeaders || {};

    // download parameters
    this.downloadFile = opts.downloadFile;
    this.downloadFileName = opts.downloadFileName;
    this.downloadFileQuery = opts.downloadFileQuery;

    // template opts
    this.useTemplates = opts.useTemplates;

    if (this.useTemplates) {
      this.templates = { ...templates, ...(opts.templates || {}) };
    }

    // cache opts
    this.useCache = opts.useCache;

    if (this.useCache) {
      this.cacheOpts = opts.cacheOpts;

      if (!this.cacheOpts.maxSizeOfCache) {
        this.cacheOpts.maxSizeOfCache = 1024 * 1024 * 10; // default 10MB
        this.cacheOpts.maxSizeOfCachedFile = 1024 * 1024 * 2; // default 2MB
      }

      this.filesCache = new FilesCache(this.cacheOpts);
    }
  }

  // files utils
  getFileInfo(url) {
    const fileName = url === '/' ? '/index.html' : url;
    const filePath = path.join(this.staticPath, fileName);
    const fileExtension = path.extname(fileName).substring(1);
    const fileMimeType = mime.getType(fileExtension);

    return {
      fileName,
      filePath,
      fileExtension,
      fileMimeType,
    };
  }

  // emit immediate emit
  immediateEmit(eventName, args = {}) {
    setImmediate(() => this.emit(eventName, args));

    return this;
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

    this.once(CONSTANTS.EVENTS.SERVER_STOP, () => {
      this.startServer();
      this.emit(CONSTANTS.EVENTS.SERVER_RESTART);
    });
    this.stopServer();

    return this;
  }

  startServer() {
    if (this.server) {
      this.immediateEmit(CONSTANTS.EVENTS.SERVER_WARNING,
        { msg: CONSTANTS.MESSAGES.SERVER_ALREADY_RUNNING });
      return this.server;
    }

    this.server = http.createServer(async (req, res) => {
      let cachingThisFile = false;
      const { url, method } = req;
      const { pathname, query } = URL.parse(url, true);

      this.immediateEmit(CONSTANTS.EVENTS.SERVER_REQUEST,
        {
          url,
          query,
          method,
          pathname,
          code: CONSTANTS.EVENT_CODES.SERVER_REQUEST,
        });

      // if request's method is wrong
      if (method !== CONSTANTS.REQUEST_METHODS.GET && method !== CONSTANTS.REQUEST_METHODS.HEAD) {
        this.immediateEmit(CONSTANTS.EVENTS.SERVER_WARNING, {
          method: req.method,
          msg   : CONSTANTS.MESSAGES.WRONG_MESSAGE,
          code  : CONSTANTS.EVENT_CODES.WRONG_MESSAGE,
        });

        return errorResponse.bind(res)({
          statusCode: 405,
          headers   : { Allow: 'GET, HEAD' },
          msg       : this.useTemplates
            ? this.templates.notAllowedMethod
            : CONSTANTS.MESSAGES.WRONG_METHOD,
        });
      }

      const { filePath, fileName, fileMimeType, fileExtension } = this.getFileInfo(pathname);

      // check mimetype
      if (!fileMimeType) {
        this.immediateEmit(CONSTANTS.EVENTS.SERVER_WARNING, {
          msg : CONSTANTS.MESSAGES.WRONG_FILE_FORMAT,
          code: CONSTANTS.EVENT_CODES.WRONG_FILE_FORMAT,
        });

        return errorResponse.bind(res)({
          statusCode: 400,
          msg       : this.useTemplates
            ? this.templates.wrongFileFormat
            : CONSTANTS.MESSAGES.WRONG_FILE_FORMAT,
        });
      }

      // is file's path safe?
      if (!filePath.startsWith(this.staticPath)) {
        this.immediateEmit(CONSTANTS.EVENTS.SERVER_WARNING, {
          msg : CONSTANTS.MESSAGES.FILE_NOT_FOUND,
          code: CONSTANTS.EVENT_CODES.FILE_NOT_FOUND,
        });

        return errorResponse.bind(res)({
          statusCode: 404,
          msg       : this.useTemplates
            ? this.templates.fileNotFound
            : CONSTANTS.MESSAGES.FILE_NOT_FOUND,
        });
      }

      const headers = {
        ...this.setHeaders,
        'Content-Type': fileMimeType,
      };

      if (this.downloadFile || (this.downloadFileQuery && query[this.downloadFileQuery])) {
        let downloadFileName = this.downloadFileName || fileName;

        if (typeof this.downloadFileName === 'function') {
          downloadFileName = this.downloadFileName(fileName, fileExtension);
        }

        headers['Content-Disposition'] = `attachment; filename="${downloadFileName}"`;
      }

      // setHeaders
      res.writeHead(200, headers);

      // try to get file from cache
      if (this.useCache && this.filesCache.hasCache(fileName)) {
        const fileFromCache = this.filesCache.getFromCache(fileName);

        if (fileFromCache) {
          res.write(fileFromCache);
          return res.end();
        }
      }

      // can we store file to the cache?
      if (this.useCache) {
        let fileStats;

        try {
          fileStats = await fs.promises.stat(filePath);
        } catch (err) {
          return errorResponse.bind(res)({
            statusCode: 404,
            msg       : this.useTemplates
              ? this.templates.fileNotFound
              : CONSTANTS.MESSAGES.FILE_NOT_FOUND,
          });
        }

        if (this.filesCache.hasAvailableCapacity(fileStats.size)
            && this.filesCache.isAllowedSizeOfFile(fileStats.size)) {
          cachingThisFile = true;
        }
      }

      const stream = fs.createReadStream(filePath);

      if (cachingThisFile) {
        this.filesCache.addToCache(fileName, stream);
      }

      // stream error handler
      stream.on('error', (err) => {
        this.immediateEmit(CONSTANTS.EVENTS.STREAM_ERROR, err);

        errorResponse.bind(res)({
          statusCode: 404,
          msg       : this.useTemplates
            ? this.templates.fileNotFound
            : CONSTANTS.MESSAGES.FILE_NOT_FOUND,
        });
      });

      stream.pipe(res);
    });

    this.server.on('error', (err) => this.emit(CONSTANTS.EVENTS.SERVER_ERROR, err));
    this.server.on('listening', () => this.emit(CONSTANTS.EVENTS.SERVER_START, {
      host: this.host,
      port: this.port,
    }));
    this.server.on('close', () => {
      this.emit(CONSTANTS.EVENTS.SERVER_STOP);
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
