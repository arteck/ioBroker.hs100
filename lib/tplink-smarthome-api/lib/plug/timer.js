'use strict';

/**
 * Timer
 */

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Timer {
  constructor(device, apiModuleName) {
    this.device = device;
    this.apiModuleName = apiModuleName;
  }
  /**
   * Get Countdown Timer Rule (only one allowed).
   *
   * Requests `count_down.get_rules`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getRules(sendOptions) {
    var _this = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              return _context.abrupt('return', _this.device.sendCommand({
                [_this.apiModuleName]: { get_rules: {} }
              }, sendOptions));

            case 1:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
  /**
   * Add Countdown Timer Rule (only one allowed).
   *
   * Sends count_down.add_rule command.
   * @param  {Object}       options
   * @param  {number}       options.delay                delay in seconds
   * @param  {boolean}      options.powerState           turn on or off device
   * @param  {string}      [options.name='timer']        rule name
   * @param  {boolean}     [options.enable=true]         rule enabled
   * @param  {boolean}     [options.deleteExisting=true] send `delete_all_rules` command before adding
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  addRule(_ref, sendOptions) {
    var _this2 = this;

    var delay = _ref.delay,
        powerState = _ref.powerState,
        _ref$name = _ref.name,
        name = _ref$name === undefined ? 'timer' : _ref$name,
        _ref$enable = _ref.enable,
        enable = _ref$enable === undefined ? true : _ref$enable,
        _ref$deleteExisting = _ref.deleteExisting,
        deleteExisting = _ref$deleteExisting === undefined ? true : _ref$deleteExisting;
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!deleteExisting) {
                _context2.next = 3;
                break;
              }

              _context2.next = 3;
              return _this2.deleteAllRules();

            case 3:
              return _context2.abrupt('return', _this2.device.sendCommand({
                [_this2.apiModuleName]: {
                  add_rule: {
                    enable: enable ? 1 : 0,
                    delay,
                    act: powerState ? 1 : 0,
                    name
                  }
                }
              }, sendOptions));

            case 4:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
  /**
   * Edit Countdown Timer Rule (only one allowed).
   *
   * Sends count_down.edit_rule command.
   * @param  {Object}       options
   * @param  {string}       options.id               rule id
   * @param  {number}       options.delay            delay in seconds
   * @param  {number}       options.powerState       turn on or off device
   * @param  {string}      [options.name='timer']    rule name
   * @param  {Boolean}     [options.enable=true]     rule enabled
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  editRule(_ref2, sendOptions) {
    var _this3 = this;

    var id = _ref2.id,
        delay = _ref2.delay,
        powerState = _ref2.powerState,
        _ref2$name = _ref2.name,
        name = _ref2$name === undefined ? 'timer' : _ref2$name,
        _ref2$enable = _ref2.enable,
        enable = _ref2$enable === undefined ? true : _ref2$enable;
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              return _context3.abrupt('return', _this3.device.sendCommand({
                [_this3.apiModuleName]: {
                  edit_rule: {
                    id,
                    enable: enable ? 1 : 0,
                    delay,
                    act: powerState ? 1 : 0,
                    name
                  }
                }
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
   * Delete Countdown Timer Rule (only one allowed).
   *
   * Sends count_down.delete_all_rules command.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  deleteAllRules(sendOptions) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              return _context4.abrupt('return', _this4.device.sendCommand({
                [_this4.apiModuleName]: { delete_all_rules: {} }
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

module.exports = Timer;