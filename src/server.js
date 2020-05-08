const fs = require('fs');
const URL = require('url');
const http = require('http');
const path = require('path');
const { EventEmitter } = require('events');

const Cache = require('./cache');
const templates = require('./templates');
const { CustomError, Errors } = require('./error');
const {
  pathIsSafe,
  pipeStreams,
  getFileInfo,
  verifyRequestMethod,
  buildDirectoryStructure,
} = require('./utils');

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
    this.baseUrl = `http://${this.host}:${this.port}`;
    this.serverOpts = {
      port   : this.port,
      host   : this.host,
      baseUrl: this.baseUrl,
    };

    this.setHeaders = opts.setHeaders || {};

    this.downloadFileName = opts.downloadFileName;
    this.downloadFileQuery = opts.downloadFileQuery;

    this.showDirectoriesStructure = opts.showDirectoriesStructure;

    this.defaultMimeType = opts.defaultMimeType || 'text/plain';

    this.templates = {};
    this.useTemplates = opts.useTemplates;

    if (this.useTemplates) {
      this.templates = { ...templates, ...(opts.templates || {}) };
    }

    this.useCache = opts.useCache;

    if (this.useCache) {
      this.cacheOpts = opts.cacheOpts || {};

      if (!this.cacheOpts.maxSizeOfCache) {
        this.cacheOpts.maxSizeOfCache = 1024 * 1024 * 10; // default 10MB
      }

      if (!this.cacheOpts.maxSizeOfCachedFile) {
        this.cacheOpts.maxSizeOfCachedFile = 1024 * 1024 * 2; // default 2MB
      }

      this.cache = new Cache(this.cacheOpts);
    }
  }

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

    this.server = http.createServer(this.serverHandler.bind(this));

    this.server.on('error', (err) => this.emit(CONSTANTS.EVENTS.SERVER_ERROR, err));
    this.server.on('listening', () => this.emit(CONSTANTS.EVENTS.SERVER_START, this.serverOpts));
    this.server.on('close', () => {
      this.emit(CONSTANTS.EVENTS.SERVER_STOP);
      this.server = null;
    });

    this.server.listen(this.port, this.host);

    return this;
  }

  async serverHandler(req, res) {
    try {
      let fileStat;
      const { url, method } = req;
      const headers = { ...this.setHeaders };
      const { pathname, query } = URL.parse(url, true);

      this.immediateEmit(CONSTANTS.EVENTS.SERVER_REQUEST, {
        url,
        query,
        method,
        pathname,
      });

      if (!verifyRequestMethod(method)) {
        this.immediateEmit(CONSTANTS.EVENTS.SERVER_WARNING, {
          method: req.method,
          msg   : CONSTANTS.MESSAGES.WRONG_METHOD,
        });

        throw Errors.notAllowedMethod(this.templates.notAllowedMethod);
      }

      const fileInfo = getFileInfo(this.staticPath, pathname, !this.showDirectoriesStructure);

      if (!pathIsSafe(fileInfo.filePath, this.staticPath)) {
        this.immediateEmit(CONSTANTS.EVENTS.SERVER_WARNING, {
          msg: CONSTANTS.MESSAGES.FILE_NOT_FOUND,
        });

        throw Errors.fileNotFound(this.templates.fileNotFound);
      }

      if (fileInfo.fileMimeType) {
        headers['Content-Type'] = fileInfo.fileMimeType;
      }

      if (this.downloadFileQuery && query[this.downloadFileQuery]) {
        let downloadFileName = this.downloadFileName || fileInfo.fileName;

        if (typeof this.downloadFileName === 'function') {
          downloadFileName = this.downloadFileName(fileInfo.fileName, fileInfo.fileExtension);
        }

        headers['Content-Disposition'] = `attachment; filename="${downloadFileName}"`;
      }

      if (this.useCache) {
        const cache = this.cache.getFromCache(fileInfo.filePath);

        if (cache) {
          return res.writeHead(200, headers).end(cache);
        }
      }

      if (this.useCache || this.showDirectoriesStructure) {
        try {
          fileStat = await fs.promises.stat(fileInfo.filePath);
        } catch (err) {
          throw Errors.fileNotFound(this.templates.fileNotFound);
        }
      }

      if (this.showDirectoriesStructure && fileStat.isDirectory()) {
        let directoriesStructure;

        // build directory structure
        try {
          const files = await fs.promises.readdir(fileInfo.filePath);

          directoriesStructure = buildDirectoryStructure(pathname, files);
        } catch (err) {
          this.immediateEmit(CONSTANTS.EVENTS.SERVER_WARNING, {
            err,
            msg: CONSTANTS.MESSAGES.DIRECTORY_NOT_FOUND,
          });

          throw Errors.fileNotFound(this.templates.fileNotFound);
        }

        const directoriesStructureBuffer = Buffer.from(directoriesStructure);

        // cache directory structure
        if (this.useCache && this.cache.canCacheIt(directoriesStructureBuffer.byteLength)) {
          this.cache.addToCache(fileInfo.filePath, directoriesStructureBuffer);
        }

        return res.writeHead(200, { 'Content-Type': 'text/html' }).end(directoriesStructure);
      }

      if (!headers['Content-Type']) {
        headers['Content-Type'] = this.defaultMimeType;
      }

      res.writeHead(200, headers);

      const readStream = fs.createReadStream(fileInfo.filePath);

      if (this.useCache && this.cache.canCacheIt(fileStat.size)) {
        this.cache.addToCache(fileInfo.filePath, readStream);
      }

      try {
        await pipeStreams(readStream, res);
      } catch (err) {
        this.immediateEmit(CONSTANTS.EVENTS.STREAM_ERROR, err);

        throw Errors.fileNotFound(this.templates.fileNotFound);
      }
    } catch (err) {
      if (!CustomError.isCustomError(err)) {
        res.statusCode = 500;
        return res.end('Something went wrong');
      }

      const data = err.data2Json();

      res.writeHead(err.statusCode, data.headers || {});

      if (data.payload) {
        res.write(Buffer.from(data.payload));
      }

      res.end();
    }
  }

  static setup(opts) {
    return new Server(opts);
  }
}

module.exports = Server;
