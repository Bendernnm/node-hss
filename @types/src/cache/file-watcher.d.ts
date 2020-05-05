import { EventEmitter } from 'events';

enum FileWatcherConstants {
    E_EDITED = 'edited',
    E_RENAMED = 'renamed',
    E_DELETED = 'deleted',

    ET_CLOSE = 'close',
    ET_ERROR = 'error',
    ET_RENAME = 'rename',
    ET_CHANGE = 'change',
}

declare class FileWatcher {
    public filePath: string;
    public fileOriginName: string;

    public static fileWatcherEvents: EventEmitter;
    public static constants: FileWatcherConstants;

    startWatch(): void;

    stopWatch(): void;

    constructor(filePath: string);

    static create(filePath: string): FileWatcher;
}

export = FileWatcher;
