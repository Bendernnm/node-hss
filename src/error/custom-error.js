function CustomError({ message, code, stack, target, statusCode = 500, data = {} } = {}) {
  Error.call(this, message);

  if (stack) {
    this.stack = stack;
  } else {
    Error.captureStackTrace(this);
  }

  this.code = code;
  this.custom = true;
  this.target = target;
  this.message = message;
  this.statusCode = statusCode;
  this.data = JSON.stringify(data);
}

CustomError.prototype = Object.create(Error.prototype);

CustomError.prototype.constructor = CustomError;

CustomError.prototype.data2Json = () => {
  let data;

  if (!this.data) {
    return {};
  }

  try {
    data = JSON.parse(this.data);
  } catch (err) {
    data = {};
  }

  return data;
};

CustomError.isCustomError = err => err instanceof CustomError;

CustomError.create = opts => new CustomError(opts);

module.exports = CustomError;
