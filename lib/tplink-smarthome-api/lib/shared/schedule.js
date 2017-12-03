/* eslint camelcase: ["off"] */
'use strict';

/**
 * Schedule
 */

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Schedule {
  constructor(device, apiModuleName) {
    this.device = device;
    this.apiModuleName = apiModuleName;
  }
  /**
   * Gets Next Schedule Rule Action.
   *
   * Requests `schedule.get_next_action`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getNextAction(sendOptions) {
    var _this = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _this.nextaction = _this.device.sendCommand({
                [_this.apiModuleName]: { get_next_action: {} }
              }, sendOptions);
              return _context.abrupt('return', _this.nextaction);

            case 2:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
  /**
   * Gets Schedule Rules.
   *
   * Requests `schedule.get_rules`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getRules(sendOptions) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              return _context2.abrupt('return', _this2.device.sendCommand({
                [_this2.apiModuleName]: { get_rules: {} }
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
   * Gets Schedule Rule.
   *
   * Requests `schedule.get_rules` and return rule matching Id
   * @param  {string}       id
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response of rule
   */
  getRule(id, sendOptions) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      var rules, rule;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return _this3.getRules(sendOptions);

            case 2:
              rules = _context3.sent;
              rule = rules.rule_list.find(function (r) {
                return r.id === id;
              });

              if (rule) {
                rule.err_code = rules.err_code;
              }
              return _context3.abrupt('return', rule);

            case 6:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3);
    }))();
  }
  /**
   * Adds Schedule rule.
   *
   * Sends `schedule.add_rule` command and returns rule id.
   * @param  {Object}       rule
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  addRule(rule, sendOptions) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              return _context4.abrupt('return', _this4.device.sendCommand({
                [_this4.apiModuleName]: { add_rule: rule }
              }, sendOptions));

            case 1:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this4);
    }))();
  }
  /**
   * Edits Schedule Rule.
   *
   * Sends `schedule.edit_rule` command.
   * @param  {Object}       rule
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  editRule(rule, sendOptions) {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              return _context5.abrupt('return', _this5.device.sendCommand({
                [_this5.apiModuleName]: { edit_rule: rule }
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
   * Deletes All Schedule Rules.
   *
   * Sends `schedule.delete_all_rules` command.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  deleteAllRules(sendOptions) {
    var _this6 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
      return _regenerator2.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              return _context6.abrupt('return', _this6.device.sendCommand({
                [_this6.apiModuleName]: { delete_all_rules: {} }
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
   * Deletes Schedule Rule.
   *
   * Sends `schedule.delete_rule` command.
   * @param  {string}       id
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  deleteRule(id, sendOptions) {
    var _this7 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
      return _regenerator2.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              return _context7.abrupt('return', _this7.device.sendCommand({
                [_this7.apiModuleName]: { delete_rule: { id } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, _this7);
    }))();
  }
  /**
   * Enables or Disables Schedule Rules.
   *
   * Sends `schedule.set_overall_enable` command.
   * @param  {boolean}     enable
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  setOverallEnable(enable, sendOptions) {
    var _this8 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8() {
      return _regenerator2.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              return _context8.abrupt('return', _this8.device.sendCommand({
                [_this8.apiModuleName]: { set_overall_enable: { enable: enable ? 1 : 0 } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, _this8);
    }))();
  }
  /**
   * Get Daily Usage Statisics.
   *
   * Sends `schedule.get_daystat` command.
   * @param  {number}       year
   * @param  {number}       month
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getDayStats(year, month, sendOptions) {
    var _this9 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee9() {
      return _regenerator2.default.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              return _context9.abrupt('return', _this9.device.sendCommand({
                [_this9.apiModuleName]: { get_daystat: { year, month } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context9.stop();
          }
        }
      }, _callee9, _this9);
    }))();
  }
  /**
   * Get Monthly Usage Statisics.
   *
   * Sends `schedule.get_monthstat` command.
   * @param  {number}       year
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getMonthStats(year, sendOptions) {
    var _this10 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee10() {
      return _regenerator2.default.wrap(function _callee10$(_context10) {
        while (1) {
          switch (_context10.prev = _context10.next) {
            case 0:
              return _context10.abrupt('return', _this10.device.sendCommand({
                [_this10.apiModuleName]: { get_monthstat: { year } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context10.stop();
          }
        }
      }, _callee10, _this10);
    }))();
  }
  /**
   * Erase Usage Statistics.
   *
   * Sends `schedule.erase_runtime_stat` command.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  eraseStats(sendOptions) {
    var _this11 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee11() {
      return _regenerator2.default.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              return _context11.abrupt('return', _this11.device.sendCommand({
                [_this11.apiModuleName]: { erase_runtime_stat: {} }
              }, sendOptions));

            case 1:
            case 'end':
              return _context11.stop();
          }
        }
      }, _callee11, _this11);
    }))();
  }
}

module.exports = Schedule;