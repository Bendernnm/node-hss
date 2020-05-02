const fs = require('fs');
const { EventEmitter } = require('events');

const watchOpts = Object.freeze({
  encoding  : 'utf8',
  persistent: true,
  recursive : false,
});

class FileWatcher {
  constructor(fileName) {
    this.fileName = fileName;

    this.startWatch();
  }

  startWatch() {
    this.watcher = fs.watch(this.fileName, watchOpts, this.watcherHandler.bind(this));
  }

  stopWatch() {
    this.watcher.close();
  }

  async watcherHandler(eventType, fileName) {
    if (eventType === FileWatcher.constants.ET_CLOSE) {
      this.watcher = null;
    }

    if (eventType === FileWatcher.constants.ET_ERROR) {
      return this.stopWatch();
    }

    // eventType === 'change'
    if (fileName !== this.fileName) { // renamed
      FileWatcher.fileWatcherEvents.emit(FileWatcher.constants.E_RENAMED, {
        newFileName: fileName,
        fileName   : this.fileName,
      });

      return this.fileName = fileName;
    }

    try {
      await fs.promises.access(fileName, fs.constants.R_OK);

      FileWatcher.fileWatcherEvents.emit(FileWatcher.constants.E_EDITED, { fileName }); // edited
    } catch (err) {
      FileWatcher.fileWatcherEvents.emit(FileWatcher.constants.E_DELETED, { fileName }); // deleted
    }
  }

  static fileWatcher(fileName) {
    return new FileWatcher(fileName);
  }
}

FileWatcher.fileWatcherEvents = new EventEmitter();

FileWatcher.constants = {
  E_EDITED : 'edited',
  E_RENAMED: 'renamed',
  E_DELETED: 'deleted',

  ET_CLOSE : 'close',
  ET_ERROR : 'error',
  ET_CHANGE: 'change',
};

module.exports = FileWatcher;
