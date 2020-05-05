interface ErrorMessagesOpts {
    useTemplates: boolean;
}

interface Objects {
    notAllowedMethod: string;
    fileNotFound: string;
    directoryNotFound: string;
}

declare class ErrorMessages {
    constructor(opts: ErrorMessagesOpts);

    setTemplates(templates: Objects): this;

    setTexts(texts: Objects): this;

    setObjects(type: string, templates: Objects): this;

    msg(): Objects;

    static create(opts: ErrorMessages): ErrorMessages;
}

export = ErrorMessages;
