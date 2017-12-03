'use strict';

module.exports = function (_ref) {
  var level = _ref.level,
      logger = _ref.logger;

  var levels = ['trace', 'debug', 'info', 'warn', 'error', 'silent'];
  var log = require('loglevel');

  level = level || 'warn';
  if (levels.indexOf(level) === -1) {
    console.error('invalid log level: %s', level);
  }
  log.setLevel(level);
  // if logger passed in, call logger functions instead of our loglevel functions
  if (logger != null) {
    levels.forEach(function (level) {
      if (typeof logger[level] === 'function') {
        log[level] = function () {
          logger[level].apply(logger, arguments);
        };
      }
    });
  }

  return log;
};