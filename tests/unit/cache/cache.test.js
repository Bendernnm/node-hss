jest.mock('../../../src/cache/file-watcher');

const FileWatcher = require('../../../src/cache/file-watcher');

const Cache = require('../../../src/cache');

beforeAll(() => jest.clearAllMocks());

afterEach(() => jest.resetAllMocks());

describe('Constructor', () => {
  it('should create cache instance', () => {
    const opts = {
      maxSizeOfCache     : 1024 * 1024 * 10,
      maxSizeOfCachedFile: 1024 * 1024 * 10,
      expirationDuration : 1000 * 60 * 10,
      watch              : false,
    };

    const cacheStore = new Cache(opts);

    expect(cacheStore).toEqual({
      cache              : new Map(),
      availableCapacity  : opts.maxSizeOfCache,
      expirationDuration : opts.expirationDuration,
      maxSizeOfCachedFile: opts.maxSizeOfCachedFile,
      watch              : opts.watch,
    });
  });

  it('should create cache watcher instance', () => {
    const spyFileWatcherEventsOn = jest.spyOn(FileWatcher.fileWatcherEvents, 'on');

    const opts = {
      maxSizeOfCache     : 1024 * 1024 * 10,
      maxSizeOfCachedFile: 1024 * 1024 * 10,
      expirationDuration : 1000 * 60 * 10,
      watch              : true,
    };

    const cacheStore = new Cache(opts);

    expect(cacheStore).toEqual({
      cache              : new Map(),
      availableCapacity  : opts.maxSizeOfCache,
      expirationDuration : opts.expirationDuration,
      maxSizeOfCachedFile: opts.maxSizeOfCachedFile,
      watch              : opts.watch,
    });

    expect(spyFileWatcherEventsOn).toHaveBeenCalledTimes(3);
  });

  it('should throw error if expirationDuration is incorrect', () => {
    const err = new Error('Incorrect expiration duration');
    const opts = {
      maxSizeOfCache     : 1024 * 1024 * 10,
      maxSizeOfCachedFile: 1024 * 1024 * 10,
      expirationDuration : -1,
      watch              : false,
    };

    expect(() => new Cache(opts)).toThrowError(err);
  });

  it('should throw error if maxSizeOfCache is incorrect', () => {
    const err = new Error('Incorrect max size');
    const opts = {
      maxSizeOfCache     : -1,
      maxSizeOfCachedFile: 1024 * 1024 * 10,
      expirationDuration : 1024 * 1024 * 10,
      watch              : false,
    };

    expect(() => new Cache(opts)).toThrowError(err);
  });

  it('should throw error if maxSizeOfCachedFile is incorrect', () => {
    const err = new Error('Incorrect max size');
    const opts = {
      maxSizeOfCache     : 1024 * 1024 * 10,
      maxSizeOfCachedFile: -1,
      expirationDuration : 1024 * 1024 * 10,
      watch              : false,
    };

    expect(() => new Cache(opts)).toThrowError(err);
  });
});

describe('Simple cache storage', () => {
  let opts;
  let cacheStore;

  let spyDateNow;

  beforeEach(() => {
    opts = {
      maxSizeOfCache     : 1024 * 1024 * 10,
      maxSizeOfCachedFile: 1024 * 1024 * 10,
      expirationDuration : 1000 * 60 * 10,
      watch              : false,
    };
    cacheStore = new Cache(opts);

    spyDateNow = jest.spyOn(Date, 'now');

    spyDateNow.mockReturnValue(1);
  });

  it('should throw error when try to add some incorrect value to cache', () => {
    const err = new Error('Passed incorrect second parameter');

    expect(() => cacheStore.addToCache('file', {})).toThrowError(err);
  });

  it('should add buffer to the cache', () => {
    const buffer = Buffer.alloc(1024);
    const byteLength = buffer.byteLength;
    const oldAvailableCapacity = cacheStore.availableCapacity;

    const spyCacheStorageChangeCapacity = jest.spyOn(cacheStore, 'changeAvailableCapacity');

    const mockChangeAvailableCapacity = sizeOfFile => cacheStore.availableCapacity += sizeOfFile;

    spyCacheStorageChangeCapacity.mockImplementationOnce(mockChangeAvailableCapacity);

    cacheStore.addToCache('file', buffer);

    const cache = cacheStore.cache.get('file');

    expect(cache).toEqual({
      buffer,
      sizeOfFile: byteLength,
      expiredAt : Date.now() + opts.expirationDuration,
    });
    expect(cacheStore.availableCapacity).toBe(oldAvailableCapacity - byteLength);
  });

  it('should throw error, when file is so big', () => {
    const buffer = Buffer.alloc(1024);
    const err = new Error('File is so big for saving to the cache');

    const spyCanCacheIt = jest.spyOn(cacheStore, 'canCacheIt');

    spyCanCacheIt.mockReturnValue(false);

    expect(() => cacheStore.addToCacheFromBuffer('file', buffer)).toThrowError(err);
  });
});
