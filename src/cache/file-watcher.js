const fs = require('fs');
const { EventEmitter } = require('events');

const watchOpts = Object.freeze({
  encoding  : 'utf8',
  persistent: true,
  recursive : false,
});

class FileWatcher {
  constructor(filePath) {
    this.filePath = filePath;
    this.fileOriginName = filePath.split('/').pop();

    this.startWatch();
  }

  startWatch() {
    try {
      this.watcher = fs.watch(this.filePath, watchOpts, this.watcherHandler.bind(this));
      return true;
    } catch (err) {
      return false;
    }
  }

  stopWatch() {
    this.watcher.close();
  }

  async watcherHandler(eventType, fileName) {
    if (eventType === FileWatcher.constants.ET_CLOSE) {
      return this.watcher = null;
    }

    if (eventType === FileWatcher.constants.ET_ERROR) {
      return this.stopWatch();
    }

    if (eventType === FileWatcher.constants.ET_CHANGE) {
      return FileWatcher.fileWatcherEvents.emit(FileWatcher.constants.E_EDITED,
        { filePath: this.filePath });
    }

    // eventType === 'rename'
    const newFilePath = this.filePath.replace(this.fileOriginName, fileName);

    try {
      await fs.promises.access(newFilePath, fs.constants.R_OK);

      FileWatcher.fileWatcherEvents.emit(FileWatcher.constants.E_RENAMED, {
        newFilePath,
        filePath: this.filePath,
      }); // rename
    } catch (err) {
      FileWatcher.fileWatcherEvents.emit(FileWatcher.constants.E_DELETED,
        { filePath: this.filePath }); // deleted
    }
  }

  static create(filePath) {
    return new FileWatcher(filePath);
  }
}

FileWatcher.fileWatcherEvents = new EventEmitter();

FileWatcher.constants = {
  E_EDITED : 'edited',
  E_RENAMED: 'renamed',
  E_DELETED: 'deleted',

  ET_CLOSE : 'close',
  ET_ERROR : 'error',
  ET_RENAME: 'rename',
  ET_CHANGE: 'change',
};

module.exports = FileWatcher;
