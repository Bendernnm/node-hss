const fs = require('fs');
const { Readable } = require('stream');

const FileWatcher = require('./file-watcher');

class Cache {
  constructor({ maxSizeOfCache, maxSizeOfCachedFile, expirationDuration, watch }) {
    if (expirationDuration && (typeof expirationDuration !== 'number' || expirationDuration <= 0)) {
      throw new Error('Incorrect expiration duration');
    }

    if (typeof maxSizeOfCache !== 'number' || maxSizeOfCache <= 0) {
      throw new Error('Incorrect max size');
    }

    if (typeof maxSizeOfCachedFile !== 'number' || maxSizeOfCachedFile <= 0) {
      throw new Error('Incorrect max size');
    }


    this.cache = new Map();

    this.availableCapacity = maxSizeOfCache; // required bytes
    this.expirationDuration = expirationDuration; // ms
    this.maxSizeOfCachedFile = maxSizeOfCachedFile; // required bytes

    this.watch = watch;

    if (this.watch) {
      this.onFileWatcher();
    }
  }

  hasCache(filePath) {
    return this.cache.has(filePath);
  }

  canCacheIt(sizeOfFile) {
    return this.isAllowedSizeOfFile(sizeOfFile) && this.hasAvailableCapacity(sizeOfFile);
  }

  isAllowedSizeOfFile(sizeOfFile) {
    return this.maxSizeOfCachedFile >= sizeOfFile;
  }

  hasAvailableCapacity(sizeOfFile) {
    return this.availableCapacity >= sizeOfFile;
  }

  changeAvailableCapacity(sizeOfFile) {
    this.availableCapacity += sizeOfFile;
  }

  getFromCache(filePath) {
    const cache = this.cache.get(filePath);

    if (!cache) {
      return null;
    }

    if (this.isExpired(filePath)) {
      this.removeFromCache(filePath);

      return null;
    }

    return cache.buffer;
  }

  addToCache(filePath, obj) {
    if (obj instanceof Buffer) {
      return this.addToCacheFromBuffer(filePath, obj);
    }

    if (obj instanceof Readable) {
      return this.addToCacheFromStream(filePath, obj);
    }

    throw new Error('Passed incorrect second parameter');
  }

  addToCacheFromBuffer(filePath, buffer) {
    const sizeOfFile = buffer.byteLength;

    if (!this.canCacheIt(sizeOfFile)) {
      throw new Error('File is so big for saving to the cache');
    }

    const cache = {
      buffer,
      sizeOfFile,
    };

    if (this.expirationDuration) {
      cache.expiredAt = Date.now() + this.expirationDuration;
    }

    if (this.watch) {
      cache.fileWatcher = FileWatcher.create(filePath);
    }

    this.cache.set(filePath, cache);
    this.changeAvailableCapacity(-sizeOfFile);
  }

  // should add checking for a length of a created buffer
  // if you would like to use this class somewhere else
  // or without checking file's stats before adding to the cache
  addToCacheFromStream(filePath, stream) {
    let buffer = Buffer.from('');

    stream.on('data', (chunk) => buffer = Buffer.concat([ buffer, chunk ]));

    stream.on('end', () => this.addToCacheFromBuffer(filePath, buffer));

    stream.on('error', () => buffer = null);
  }

  removeFromCache(filePath) {
    const cache = this.cache.get(filePath);

    if (!cache) {
      return;
    }

    if (this.watch) {
      const fileWatcher = cache.fileWatcher;

      if (fileWatcher) {
        fileWatcher.stopWatch();
      }
    }

    this.changeAvailableCapacity(cache.sizeOfFile);
    this.cache.delete(filePath);
  }

  isExpired(filePath) {
    if (!this.expirationDuration) {
      return false;
    }

    const cache = this.cache.get(filePath);

    if (!cache) {
      throw new Error('File wasn\'t cached');
    }

    if (!cache.expiredAt) {
      return false;
    }

    return Date.now() > cache.expiredAt;
  }

  onFileWatcher() {
    const { E_EDITED, E_DELETED, E_RENAMED } = FileWatcher.constants;

    FileWatcher.fileWatcherEvents.on(E_EDITED, async ({ filePath }) => {
      let buffer;
      const cache = this.cache.get(filePath);

      if (!cache) {
        return;
      }

      try {
        buffer = await fs.promises.readFile(filePath);
      } catch (err) {
        return this.removeFromCache(filePath);
      }

      this.changeAvailableCapacity(cache.sizeOfFile);
      this.addToCacheFromBuffer(filePath, buffer);
    });

    FileWatcher.fileWatcherEvents.on(E_DELETED, ({ filePath }) => this.removeFromCache(filePath));

    FileWatcher.fileWatcherEvents.on(E_RENAMED, async ({ filePath, newFilePath }) => {
      const cache = this.cache.get(filePath);

      if (!cache) {
        return;
      }

      this.cache.set(newFilePath, cache);
      this.cache.delete(filePath);
    });
  }
}

module.exports = Cache;
