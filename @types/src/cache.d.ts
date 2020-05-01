export { Readable } from 'stream';

interface CacheOpts {
    maxSizeOfCache: number;
    maxSizeOfCachedFile: number;
    expirationDuration?: number;
}

declare class Cache {
    public cache: Map<string, Buffer>;

    public availableCapacity: number;
    public expirationDuration: number;
    public maxSizeOfCachedFile: number;

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
}

export = Cache;
