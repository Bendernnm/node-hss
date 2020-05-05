interface Parameters {
    msg: string;
    headers: any;
    statusCode: number;
}

declare function errorResponse(parameters: Parameters, end: boolean = true);

export = errorResponse;
