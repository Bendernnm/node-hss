import Cache from './cache';

interface CacheOpts {
    maxSizeOfCache: number;
    maxSizeOfCachedFile: number;
    expirationDuration?: number;
}

interface ServerOpts {
    port: number;
    host: string;
    baseUrl: string;
}

interface StaticServerOpts {
    path: string;

    host?: string;
    port?: number;

    setHeaders?: any;

    downloadFileName?: string | Function;
    downloadFileQuery?: string;

    showDirectoriesStructure?: boolean;

    defaultMimeType?: string;

    useTemplates?: boolean;

    useCache?: string;
    cacheOpts?: CacheOpts;
}

declare class StaticServer implements StaticServerOpts {
    public staticPath: string;

    public baseUrl: string;
    public serverOpts: ServerOpts;

    public templates?: any;

    public cache?: Cache;

    constructor(opts: string | StaticServerOpts);

    immediateEmit(eventName: string, args: any): Server;

    stopServer(): Server;

    restartServer(): Server;

    startServer(): Server;

    static setup(opts: StaticServerOpts): Server;
}

export = StaticServer;
