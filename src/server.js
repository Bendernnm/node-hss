const fs = require('fs');
const URL = require('url');
const http = require('http');
const path = require('path');
const { EventEmitter } = require('events');

const Cache = require('./cache');
const templates = require('./templates');
const { getFileInfo, errorResponse, buildDirectoryStructure } = require('./utils');

const CONSTANTS = require('./const');

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

    this.showDirectoriesStructure = opts.showDirectoriesStructure;

    this.defaultMimeType = opts.defaultMimeType || 'text/plain';

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

      this.cache = new Cache(this.cacheOpts);
    }
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
      let fileStat;
      const { url, method } = req;
      const headers = { ...this.setHeaders };
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

      // get basic info about file/directory
      const { filePath, fileName, fileMimeType, fileExtension } = getFileInfo(this.staticPath,
        pathname, !this.showDirectoriesStructure);

      // is path safe?
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

      if (fileMimeType) {
        headers['Content-Type'] = fileMimeType;
      }

      // download file settings
      if (this.downloadFile || (this.downloadFileQuery && query[this.downloadFileQuery])) {
        let downloadFileName = this.downloadFileName || fileName;

        if (typeof this.downloadFileName === 'function') {
          downloadFileName = this.downloadFileName(fileName, fileExtension);
        }

        headers['Content-Disposition'] = `attachment; filename="${downloadFileName}"`;
      }

      // try to get file or directory's structure from cache
      if (this.useCache && this.cache.hasCache(fileName)) {
        const fileFromCache = this.cache.getFromCache(fileName);

        return res.writeHead(200, headers).end(fileFromCache);
      }

      // get file stat
      if (this.useCache || this.showDirectoriesStructure) {
        try {
          fileStat = await fs.promises.stat(filePath);
        } catch (err) {
          return errorResponse.bind(res)({
            statusCode: 404,
            msg       : this.useTemplates
              ? this.templates.fileNotFound
              : CONSTANTS.MESSAGES.FILE_NOT_FOUND,
          });
        }
      }

      // is it directory?
      if (this.showDirectoriesStructure && fileStat.isDirectory()) {
        let directoriesStructure;

        // build directory structure
        try {
          const files = await fs.promises.readdir(filePath);

          directoriesStructure = await buildDirectoryStructure(pathname, files);
        } catch (err) {
          this.immediateEmit(CONSTANTS.EVENTS.SERVER_WARNING, {
            err,
            msg : CONSTANTS.MESSAGES.DIRECTORY_NOT_FOUND,
            code: CONSTANTS.EVENT_CODES.DIRECTORY_NOT_FOUND,
          });

          return errorResponse.bind(res)({
            statusCode: 404,
            msg       : this.useTemplates
              ? this.templates.directoryNotFound
              : CONSTANTS.MESSAGES.DIRECTORY_NOT_FOUND,
          });
        }

        const buffer = Buffer.from(directoriesStructure);

        // cache directory structure
        if (this.useCache && this.cache.isAllowedSizeOfFile(buffer.byteLength)
            && this.cache.hasAvailableCapacity(buffer.byteLength)) {
          this.cache.addToCache(fileName, buffer);
        }

        return res.writeHead(200, { 'Content-Type': 'text/html' }).end(directoriesStructure);
      }

      if (!headers['Content-Type']) {
        headers['Content-Type'] = this.defaultMimeType;
      }

      // set headers and status
      res.writeHead(200, headers);

      const stream = fs.createReadStream(filePath);

      // should we cache this file?
      if (this.useCache
          && this.cache.isAllowedSizeOfFile(fileStat.size)
          && this.cache.hasAvailableCapacity(fileStat.size)) {
        this.cache.addToCache(fileName, stream);
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
