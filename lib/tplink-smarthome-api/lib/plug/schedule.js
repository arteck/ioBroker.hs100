/* eslint camelcase: ["off"] */
'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schedule = require('../shared/schedule');

var _require = require('../utils'),
    createScheduleRule = _require.createScheduleRule;

/**
 * PlugSchedule
 */


class PlugSchedule extends Schedule {
  /**
   * Adds Schedule rule.
   *
   * Sends `schedule.add_rule` command and returns rule id.
   * @param  {Object}        options
   * @param  {boolean}       options.powerState
   * @param  {(Date|number)} options.start  Date or number of minutes
   * @param  {number[]}     [options.daysOfWeek]  [0,6] = weekend, [1,2,3,4,5] = weekdays
   * @param  {string}       [options.name]
   * @param  {boolean}      [options.enable=true]
   * @param  {SendOptions}  [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  addRule(_ref, sendOptions) {
    var _this = this;

    var powerState = _ref.powerState,
        start = _ref.start,
        daysOfWeek = _ref.daysOfWeek,
        _ref$name = _ref.name,
        name = _ref$name === undefined ? '' : _ref$name,
        _ref$enable = _ref.enable,
        enable = _ref$enable === undefined ? true : _ref$enable;
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      var rule;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              rule = (0, _assign2.default)({
                sact: powerState ? 1 : 0,
                name,
                enable: enable ? 1 : 0,
                emin: 0,
                etime_opt: -1
              }, createScheduleRule({ start, daysOfWeek }));
              return _context.abrupt('return', Schedule.prototype.addRule.call(_this, rule, sendOptions));

            case 2:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
  /**
   * Edits Schedule rule.
   *
   * Sends `schedule.edit_rule` command and returns rule id.
   * @param  {Object}        options
   * @param  {string}        options.id
   * @param  {boolean}       options.powerState
   * @param  {(Date|number)} options.start  Date or number of minutes
   * @param  {number[]}     [options.daysOfWeek]  [0,6] = weekend, [1,2,3,4,5] = weekdays
   * @param  {string}       [options.name]    [description]
   * @param  {boolean}      [options.enable=true]
   * @param  {SendOptions}  [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  editRule(_ref2, sendOptions) {
    var _this2 = this;

    var id = _ref2.id,
        powerState = _ref2.powerState,
        start = _ref2.start,
        daysOfWeek = _ref2.daysOfWeek,
        _ref2$name = _ref2.name,
        name = _ref2$name === undefined ? '' : _ref2$name,
        _ref2$enable = _ref2.enable,
        enable = _ref2$enable === undefined ? true : _ref2$enable;
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      var rule;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              rule = (0, _assign2.default)({
                id,
                sact: powerState ? 1 : 0,
                name,
                enable: enable ? 1 : 0,
                emin: 0,
                etime_opt: -1
              }, createScheduleRule({ start, daysOfWeek }));
              return _context2.abrupt('return', Schedule.prototype.editRule.call(_this2, rule, sendOptions));

            case 2:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
}

module.exports = PlugSchedule;