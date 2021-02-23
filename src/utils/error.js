const {
  HTTP_STATUS_CODES
} = require('./constants');

module.exports = class BotError extends Error {
  constructor (...args) {
    super(args[0]);
    this.code = args[1];
    this.status = HTTP_STATUS_CODES[args[1]] || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
};
