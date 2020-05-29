const fs = require('fs');

const FileWatcher = require('../../src/cache/file-watcher');

let spyFsWatch;

beforeAll(() => jest.clearAllMocks());

beforeEach(() => {
  spyFsWatch = jest.spyOn(fs, 'watch');
});

afterEach(() => jest.resetAllMocks());

describe('Creating instance', () => {
  let fileOriginName;
  let filePath;
  let watcher;

  beforeEach(() => {
    fileOriginName = 'file.txt';
    filePath = '/static/file.txt';
    watcher = {
      watcher: { file: '/file' },
      close  : () => 1,
    };

    spyFsWatch.mockReturnValue(watcher);
  });

  it('should create object by static function', () => {
    const fileWatcher = FileWatcher.create(filePath);

    expect(fileWatcher instanceof FileWatcher).toBe(true);
    expect(fileWatcher).toEqual({
      watcher,
      filePath,
      fileOriginName,
    });
  });

  it('should validate object after creating', () => {
    const fileWatcher = new FileWatcher('/static/file.txt');

    expect(fileWatcher).toEqual({
      watcher,
      filePath,
      fileOriginName,
    });
  });


  describe('Watcher handler', () => {
    let fileName;
    let fileWatcher;

    beforeEach(() => {
      fileName = 'file2.txt';

      fileWatcher = FileWatcher.create(filePath);
    });

    it('should call close event', async () => {
      await fileWatcher.watcherHandler(FileWatcher.constants.ET_CLOSE, fileName);

      expect(fileWatcher.watcher).toBe(null);
    });

    it('should call error event', async () => {
      const spyFileWatcherStopWatch = jest.spyOn(fileWatcher, 'stopWatch');

      await fileWatcher.watcherHandler(FileWatcher.constants.ET_ERROR, fileName);

      expect(spyFileWatcherStopWatch).toHaveBeenCalled();
    });

    describe('Emit events', () => {
      let spyEventsEmit;

      beforeEach(() => {
        spyEventsEmit = jest.spyOn(FileWatcher.fileWatcherEvents, 'emit');
      });

      it('should call change event', async () => {
        await fileWatcher.watcherHandler(FileWatcher.constants.ET_CHANGE, fileName);

        expect(spyEventsEmit).toHaveBeenCalledWith(FileWatcher.constants.E_EDITED, { filePath });
      });

      describe('Rename event', () => {
        let spyFsPromiseAccess;

        beforeEach(() => {
          spyFsPromiseAccess = jest.spyOn(fs.promises, 'access');
        });

        it('should call rename event - rename', async () => {
          spyFsPromiseAccess.mockResolvedValueOnce({});

          await fileWatcher.watcherHandler(FileWatcher.constants.ET_RENAME, fileName);

          expect(spyEventsEmit).toHaveBeenCalledWith(FileWatcher.constants.E_RENAMED, {
            filePath,
            newFilePath: filePath.replace(fileOriginName, fileName),
          });
        });

        it('should call rename event - delete', async () => {
          const err = new Error('access error');

          spyFsPromiseAccess.mockRejectedValueOnce(err);

          await fileWatcher.watcherHandler(FileWatcher.constants.ET_RENAME, fileName);

          expect(spyEventsEmit).toHaveBeenCalledWith(FileWatcher.constants.E_DELETED, { filePath });
        });
      });
    });
  });
});

it('should stop watcher', () => {
  spyFsWatch.mockReturnValue({
    watcher: { file: '/file' },
    close  : () => 1,
  });

  const fileWatcher = new FileWatcher('/static/file.txt');

  fileWatcher.stopWatch();
});

it('should throw error, when watcher throw error', () => {
  const err = new Error('Watcher error');

  spyFsWatch.mockImplementation(() => {
    throw err;
  });

  const fileWatcher = new FileWatcher('/static/file.txt');

  expect(fileWatcher.startWatch()).toBe(false);
});
