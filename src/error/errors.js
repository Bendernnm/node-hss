const CustomError = require('./custom-error');

const {
  WRONG_METHOD,
  FILE_NOT_FOUND,
  DIRECTORY_NOT_FOUND,
} = require('./error-messages');
const ERROR_CODES = require('./error-codes');

module.exports.notAllowedMethod = (message = WRONG_METHOD) => CustomError.create({
  message,
  statusCode: 405,
  target    : 'http-method',
  code      : ERROR_CODES.WRONG_METHOD,
  data      : { headers: { Allow: 'GET, HEAD' } },
});

module.exports.fileNotFound = (message = FILE_NOT_FOUND) => CustomError.create({
  message,
  statusCode: 404,
  target    : 'file',
  code      : ERROR_CODES.FILE_NOT_FOUND,
});

module.exports.directoryNotFound = (message = DIRECTORY_NOT_FOUND) => CustomError.create({
  message,
  statusCode: 404,
  target    : 'directory',
  code      : ERROR_CODES.DIRECTORY_NOT_FOUND,
});
