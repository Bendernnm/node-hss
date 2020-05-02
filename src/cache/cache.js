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
      this.fileWathers = new Map();

      this.onFileWatcher();
    }
  }

  hasCache(fileName) {
    return this.cache.has(fileName);
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

  getFromCache(fileName) {
    const cache = this.cache.get(fileName);

    if (!cache) {
      return null;
    }

    if (this.isExpired(fileName)) {
      this.removeFromCache(fileName);

      return null;
    }

    return cache.buffer;
  }

  addToCache(fileName, obj) {
    if (obj instanceof Buffer) {
      return this.addToCacheFromBuffer(fileName, obj);
    }

    if (obj instanceof Readable) {
      return this.addToCacheFromStream(fileName, obj);
    }

    throw new Error('Passed incorrect second parameter');
  }

  addToCacheFromBuffer(fileName, buffer) {
    const sizeOfFile = buffer.byteLength;

    if (!this.hasAvailableCapacity(sizeOfFile) || !this.isAllowedSizeOfFile(sizeOfFile)) {
      throw new Error('File is so big for saving to the cache');
    }

    const cache = {
      buffer,
      sizeOfFile,
    };

    if (this.expirationDuration) {
      cache.expiredAt = Date.now() + this.expirationDuration;
    }

    this.cache.set(fileName, cache);
    this.changeAvailableCapacity(-sizeOfFile);

    if (this.watch) {
      this.fileWathers.set(fileName, FileWatcher.create(fileName));
    }
  }

  // should add checking for a length of a buffer
  // if you would like to use this class somewhere else
  // or without checking file's stats before adding to the cache
  addToCacheFromStream(fileName, stream) {
    let buffer = Buffer.from('');

    stream.on('data', (chunk) => buffer = Buffer.concat([ buffer, chunk ]));

    stream.on('end', () => this.addToCacheFromBuffer(fileName, buffer));

    stream.on('error', () => buffer = null);
  }

  removeFromCache(fileName) {
    const cache = this.cache.get(fileName);

    if (!cache) {
      return;
    }

    this.cache.delete(fileName);
    this.changeAvailableCapacity(cache.sizeOfFile);

    if (this.watch) {
      const watcher = this.fileWathers.get(fileName);

      if (!watcher) {
        return;
      }

      watcher.stopWatch();
      this.fileWathers.delete(fileName);
    }
  }

  isExpired(fileName) {
    if (!this.expirationDuration) {
      return false;
    }

    const cache = this.cache.get(fileName);

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

    FileWatcher.fileWatcherEvents.on(E_EDITED, async ({ fileName }) => {
      let buffer;
      const cache = this.cache.get(fileName);

      if (!cache) {
        return;
      }

      try {
        buffer = await fs.promises.readFile(fileName);
      } catch (err) {
        return this.removeFromCache(fileName);
      }

      this.cache.set(fileName, buffer);
      this.changeAvailableCapacity(cache.sizeOfFile - buffer.byteLength);
    });

    FileWatcher.fileWatcherEvents.on(E_DELETED, ({ fileName }) => this.removeFromCache(fileName));

    FileWatcher.fileWatcherEvents.on(E_RENAMED, async ({ fileName, newFileName }) => {
      const cache = this.cache.get(fileName);

      if (!cache) {
        return;
      }

      this.cache.set(newFileName, cache);
      this.cache.delete(fileName);

      const watcher = this.fileWathers.get(fileName);

      if (watcher) {
        return;
      }

      this.fileWathers.set(newFileName, watcher);
      this.fileWathers.delete(fileName);
    });
  }
}

module.exports = Cache;
