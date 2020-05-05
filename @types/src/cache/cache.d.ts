import { Readable } from 'stream';
import FileWatcher from './file-watcher';

interface CacheOpts {
    maxSizeOfCache: number;
    maxSizeOfCachedFile: number;
    expirationDuration?: number;
    watch: boolean;
}

interface WatcherEvent {
    filePath: string;
    newFilePath?: string;
}

interface CacheItem {
    buffer: Buffer;
    sizeOfFile: number;
    expiredAt?: number;
    fileWatcher?: FileWatcher;
}

declare class Cache {
    public availableCapacity: number;
    public expirationDuration: number;
    public maxSizeOfCachedFile: number;
    public watch: boolean;
    public cache: Map<string, CacheItem>;

    constructor(opts: CacheOpts);

    hasCache(fileName: string): boolean;

    canCacheIt(sizeOfFile: number): boolean;

    isAllowedSizeOfFile(sizeOfFile: number): boolean;

    hasAvailableCapacity(sizeOfFile: number): boolean;

    changeAvailableCapacity(sizeOfFile: number): void;

    getFromCache(fileName: string): Buffer;

    addToCache(fileName: string, obj: Buffer | Readable): void;

    addToCacheFromBuffer(fileName: string, buffer: Buffer): void;

    addToCacheFromStream(fileName: string, stream: Readable): void;

    removeFromCache(fileName: string): void;

    isExpired(fileName: string): boolean;

    onFileWatcher(): void;

    async watcherEdited(opts: WatcherEvent): void;

    async watcherDeleted(opts: WatcherEvent): void;

    async watcherRenamed(opts: WatcherEvent): void;
}

export = Cache;
