module.exports = {
  REQUEST_METHODS: {
    GET : 'GET',
    HEAD: 'HEAD',
  },
  EVENTS         : {
    SERVER_WARNING: 'serverWarning',
    SERVER_START  : 'serverStart',
    SERVER_STOP   : 'serverStop',
    SERVER_RESTART: 'serverRestart',
    SERVER_ERROR  : 'serverError',
    SERVER_REQUEST: 'serverRequest',
    STREAM_ERROR  : 'streamError',
  },
  EVENT_CODES    : {
    SERVER_REQUEST   : 1022,
    SERVER_START     : 1031,
    SERVER_STOP      : 1032,
    SERVER_RESTART   : 1032,
    SERVER_ERROR     : 1034,
    WRONG_MESSAGE    : 1041,
    WRONG_FILE_FORMAT: 1042,
    STREAM_ERROR     : 1043,
    FILE_NOT_FOUND   : 1044,
  },
  MESSAGES       : {
    WRONG_MESSAGE         : 'Wrong message',
    FILE_NOT_FOUND        : 'File not found',
    WRONG_FILE_FORMAT     : 'Not allowed file\'s format',
    SERVER_ALREADY_RUNNING: 'Server already running'
  },
};
