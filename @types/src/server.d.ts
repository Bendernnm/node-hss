import { IncomingMessage, ServerResponse } from 'http';

import Cache from './cache';
import ErrorMessages from './utils/error-messages';

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

    useCache?: boolean;
    cacheOpts?: CacheOpts;
}

declare class StaticServer implements StaticServerOpts {
    public path: string;
    public staticPath: string;

    public host: string;
    public port: number;
    public baseUrl: string;
    public serverOpts: ServerOpts;

    public setHeaders?: any;

    public downloadFileName?: string | Function;
    public downloadFileQuery?: string;

    public showDirectoriesStructure?: boolean;

    public defaultMimeType: string;

    public useTemplates?: boolean;
    public templates?: any;

    public errorMsg: ErrorMessages;

    public useCache?: boolean;
    public cache?: Cache;

    constructor(opts: string | StaticServerOpts);

    immediateEmit(eventName: string, args: any): this;

    stopServer(): this;

    restartServer(): this;

    startServer(): this;

    async serverHandler(req: IncomingMessage, res: ServerResponse): void;

    static setup(opts: StaticServerOpts): StaticServer;
}

export = StaticServer;
