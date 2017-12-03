'use strict';

/**
 * Eemter
 */

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Emeter {
  constructor(device, apiModuleName) {
    this.device = device;
    this.apiModuleName = apiModuleName;

    this._realtime = {};
  }
  /**
   * Returns cached results from last retrieval of `emeter.get_realtime`.
   * @return {Object}
   */
  get realtime() {
    return this._realtime;
  }
  /**
   * @private
   */
  set realtime(realtime) {
    this._realtime = realtime;
    this.device.emit('emeter-realtime-update', this._realtime);
  }
  /**
   * Gets device's current energy stats.
   *
   * Requests `emeter.get_realtime`.
   * @param  {SendOptions}  [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getRealtime(sendOptions) {
    var _this = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _this.device.sendCommand({
                [_this.apiModuleName]: { get_realtime: {} }
              }, sendOptions);

            case 2:
              _this.realtime = _context.sent;
              return _context.abrupt('return', _this.realtime);

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
  /**
   * Get Daily Emeter Statisics.
   *
   * Sends `emeter.get_daystat` command.
   * @param  {number}       year
   * @param  {number}       month
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getDayStats(year, month, sendOptions) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              return _context2.abrupt('return', _this2.device.sendCommand({
                [_this2.apiModuleName]: { get_daystat: { year, month } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
  /**
   * Get Monthly Emeter Statisics.
   *
   * Sends `emeter.get_monthstat` command.
   * @param  {number}       year
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getMonthStats(year, sendOptions) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              return _context3.abrupt('return', _this3.device.sendCommand({
                [_this3.apiModuleName]: { get_monthstat: { year } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3);
    }))();
  }
  /**
   * Erase Emeter Statistics.
   *
   * Sends `emeter.erase_runtime_stat` command.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  eraseStats(sendOptions) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              return _context4.abrupt('return', _this4.device.sendCommand({
                [_this4.apiModuleName]: { erase_emeter_stat: {} }
              }, sendOptions));

            case 1:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this4);
    }))();
  }
}

module.exports = Emeter;