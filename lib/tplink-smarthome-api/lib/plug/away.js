'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('../utils'),
    createScheduleRule = _require.createScheduleRule;

/**
 * Away
 */


class Away {
  constructor(device, apiModuleName) {
    this.device = device;
    this.apiModuleName = apiModuleName;
  }
  /**
   * Gets Away Rules.
   *
   * Requests `anti_theft.get_rules`.
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
   * Gets Away Rule.
   *
   * Requests `anti_theft.get_rules` and return rule matching Id
   * @param  {string}       id
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response of rule
   */
  getRule(id, sendOptions) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      var rules, rule;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return _this2.getRules(sendOptions);

            case 2:
              rules = _context2.sent;
              rule = rules.rule_list.find(function (r) {
                return r.id === id;
              });

              if (rule) {
                rule.err_code = rules.err_code;
              }
              return _context2.abrupt('return', rule);

            case 6:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
  /**
   * Adds Away Rule.
   *
   * Sends `anti_theft.add_rule` command and returns rule id.
   * @param  {Object}        options
   * @param  {(Date|number)} options.start   Date or number of minutes
   * @param  {(Date|number)} options.end     Date or number of minutes (only time component of date is used)
   * @param  {number[]}      options.daysOfWeek  [0,6] = weekend, [1,2,3,4,5] = weekdays
   * @param  {number}       [options.frequency=5]
   * @param  {string}       [options.name]
   * @param  {boolean}      [options.enable=true]
   * @param  {SendOptions}  [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  addRule(_ref, sendOptions) {
    var _this3 = this;

    var start = _ref.start,
        end = _ref.end,
        daysOfWeek = _ref.daysOfWeek,
        _ref$frequency = _ref.frequency,
        frequency = _ref$frequency === undefined ? 5 : _ref$frequency,
        _ref$name = _ref.name,
        name = _ref$name === undefined ? '' : _ref$name,
        _ref$enable = _ref.enable,
        enable = _ref$enable === undefined ? true : _ref$enable;
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      var rule;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              rule = (0, _assign2.default)({
                frequency,
                name,
                enable: enable ? 1 : 0
              }, createScheduleRule({ start, end, daysOfWeek }));
              return _context3.abrupt('return', _this3.device.sendCommand({
                [_this3.apiModuleName]: { add_rule: rule }
              }, sendOptions));

            case 2:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3);
    }))();
  }
  /**
   * Edits Away rule.
   *
   * Sends `anti_theft.edit_rule` command and returns rule id.
   * @param  {Object}        options
   * @param  {string}        options.id
   * @param  {(Date|number)} options.start   Date or number of minutes
   * @param  {(Date|number)} options.end     Date or number of minutes (only time component of date is used)
   * @param  {number[]}      options.daysOfWeek  [0,6] = weekend, [1,2,3,4,5] = weekdays
   * @param  {number}       [options.frequency=5]
   * @param  {string}       [options.name]
   * @param  {boolean}      [options.enable=true]
   * @param  {SendOptions}  [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  editRule(_ref2, sendOptions) {
    var _this4 = this;

    var id = _ref2.id,
        start = _ref2.start,
        end = _ref2.end,
        daysOfWeek = _ref2.daysOfWeek,
        _ref2$frequency = _ref2.frequency,
        frequency = _ref2$frequency === undefined ? 5 : _ref2$frequency,
        _ref2$name = _ref2.name,
        name = _ref2$name === undefined ? '' : _ref2$name,
        _ref2$enable = _ref2.enable,
        enable = _ref2$enable === undefined ? true : _ref2$enable;
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      var rule;
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              rule = (0, _assign2.default)({
                id,
                frequency,
                name,
                enable: enable ? 1 : 0
              }, createScheduleRule({ start, end, daysOfWeek }));
              return _context4.abrupt('return', _this4.device.sendCommand({
                [_this4.apiModuleName]: { edit_rule: rule }
              }, sendOptions));

            case 2:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this4);
    }))();
  }
  /**
   * Deletes All Away Rules.
   *
   * Sends `anti_theft.delete_all_rules` command.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  deleteAllRules(sendOptions) {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              return _context5.abrupt('return', _this5.device.sendCommand({
                [_this5.apiModuleName]: { delete_all_rules: {} }
              }, sendOptions));

            case 1:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this5);
    }))();
  }
  /**
   * Deletes Away Rule.
   *
   * Sends `anti_theft.delete_rule` command.
   * @param  {string}       id
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  deleteRule(id, sendOptions) {
    var _this6 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
      return _regenerator2.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              return _context6.abrupt('return', _this6.device.sendCommand({
                [_this6.apiModuleName]: { delete_rule: { id } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, _this6);
    }))();
  }
  /**
   * Enables or Disables Away Rules.
   *
   * Sends `anti_theft.set_overall_enable` command.
   * @param  {boolean}      enable
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  setOverallEnable(enable, sendOptions) {
    var _this7 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
      return _regenerator2.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              return _context7.abrupt('return', _this7.device.sendCommand({
                [_this7.apiModuleName]: { set_overall_enable: { enable: enable ? 1 : 0 } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, _this7);
    }))();
  }
}

module.exports = Away;