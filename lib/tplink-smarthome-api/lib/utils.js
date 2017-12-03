/* eslint camelcase: ["off"] */
'use strict';
/**
 * Represents an error result received from a TP-Link device.
 *
 * Where response err_code != 0.
 * @extends Error
 */

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ResponseError extends Error {
  constructor(message, response) {
    super(message);
    this.name = 'ResponseError';
    this.message = `${message} response: ${(0, _stringify2.default)(response)}`;
    this.response = response;
    Error.captureStackTrace(this, this.constructor);
  }
}

function isDate(val) {
  return val instanceof Date;
}
function isNumber(val) {
  return typeof val === 'number';
}

function createScheduleDate(date, startOrEnd) {
  var min = void 0;
  var time_opt = 0;

  if (isDate(date)) {
    min = date.getHours() * 60 + date.getMinutes();
  } else if (isNumber(date)) {
    min = date;
  } else if (date === 'sunrise') {
    min = 0;
    time_opt = 1;
  } else if (date === 'sunset') {
    min = 0;
    time_opt = 2;
  }

  if (startOrEnd === 'end') {
    return { emin: min, etime_opt: time_opt };
  } else {
    return { smin: min, stime_opt: time_opt };
  }
}

function createWday(daysOfWeek) {
  var wday = [false, false, false, false, false, false, false];
  daysOfWeek.forEach(function (dw) {
    wday[dw] = true;
  });
  return wday;
}

function createScheduleRule(_ref) {
  var start = _ref.start,
      _ref$end = _ref.end,
      end = _ref$end === undefined ? null : _ref$end,
      _ref$daysOfWeek = _ref.daysOfWeek,
      daysOfWeek = _ref$daysOfWeek === undefined ? null : _ref$daysOfWeek;

  var sched = {};

  (0, _assign2.default)(sched, createScheduleDate(start, 'start'));
  if (end !== null) {
    (0, _assign2.default)(sched, createScheduleDate(end, 'end'));
  }

  if (daysOfWeek !== null && daysOfWeek.length > 0) {
    sched.wday = createWday(daysOfWeek);
    sched.repeat = true;
  } else {
    var date = isDate(start) ? start : new Date();
    sched.day = date.getDate();
    sched.month = date.getMonth() + 1;
    sched.year = date.getFullYear();
    sched.wday = [false, false, false, false, false, false, false];
    sched.wday[date.getDay()] = true;
    sched.repeat = false;
  }

  return sched;
}

module.exports = {
  ResponseError,
  createScheduleRule
};