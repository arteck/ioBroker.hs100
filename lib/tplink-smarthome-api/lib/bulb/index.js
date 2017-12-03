'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Device = require('../device');
var Cloud = require('../shared/cloud');
var Emeter = require('../shared/emeter');
var Lighting = require('./lighting');
var Schedule = require('./schedule');
var Time = require('../shared/time');

/**
 * Bulb Device.
 *
 * TP-Link models: LB100, LB110, LB120, LB130.
 * @extends Device
 * @extends EventEmitter
 * @emits  Bulb#lightstate-on
 * @emits  Bulb#lightstate-off
 * @emits  Bulb#lightstate-change
 * @emits  Bulb#lightstate-update
 * @emits  Bulb#emeter-realtime-update
 */
class Bulb extends Device {
  /**
   * Created by {@link Client} - Do not instantiate directly.
   *
   * See {@link Device#constructor} for common options.
   * @see Device#constructor
   * @param  {Object} options
   */
  constructor(_ref) {
    var client = _ref.client,
        sysInfo = _ref.sysInfo,
        host = _ref.host,
        port = _ref.port,
        logger = _ref.logger,
        defaultSendOptions = _ref.defaultSendOptions;

    super({ client, host, port, logger, defaultSendOptions }); // sysInfo omitted

    this.supportsEmeter = true;

    this.apiModuleNamespace = {
      'system': 'smartlife.iot.common.system',
      'cloud': 'smartlife.iot.common.cloud',
      'schedule': 'smartlife.iot.common.schedule',
      'timesetting': 'smartlife.iot.common.timesetting',
      'emeter': 'smartlife.iot.common.emeter',
      'netif': 'netif',
      'lightingservice': 'smartlife.iot.smartbulb.lightingservice'
    };

    /**
     * @borrows Cloud#getInfo as Bulb.cloud#getInfo
     * @borrows Cloud#bind as Bulb.cloud#bind
     * @borrows Cloud#unbind as Bulb.cloud#unbind
     * @borrows Cloud#getFirmwareList as Bulb.cloud#getFirmwareList
     * @borrows Cloud#setServerUrl as Bulb.cloud#setServerUrl
     */
    this.cloud = new Cloud(this, 'smartlife.iot.common.cloud');
    /**
     * Bulb's Energy Monitoring Details were updated from device. Fired regardless if status was changed.
     * @event Bulb#emeter-realtime-update
     * @property {Object} value emeterRealtime
     */
    /**
     * @borrows Emeter#realtime as Bulb.emeter#realtime
     * @borrows Emeter#getRealtime as Bulb.emeter#getRealtime
     * @borrows Emeter#getDayStats as Bulb.emeter#getDayStats
     * @borrows Emeter#getMonthStats as Bulb.emeter#getMonthStats
     * @borrows Emeter#eraseStats as Bulb.emeter#eraseStats
     */
    this.emeter = new Emeter(this, 'smartlife.iot.common.emeter');
    /**
     * @borrows Lighting#lightState as Bulb.lighting#lightState
     * @borrows Lighting#getLightState as Bulb.lighting#getLightState
     * @borrows Lighting#setLightState as Bulb.lighting#setLightState
     */
    this.lighting = new Lighting(this, 'smartlife.iot.smartbulb.lightingservice');
    /**
     * @borrows Schedule#getNextAction as Bulb.schedule#getNextAction
     * @borrows Schedule#getRules as Bulb.schedule#getRules
     * @borrows Schedule#getRule as Bulb.schedule#getRule
     * @borrows BulbSchedule#addRule as Bulb.schedule#addRule
     * @borrows BulbSchedule#editRule as Bulb.schedule#editRule
     * @borrows Schedule#deleteAllRules as Bulb.schedule#deleteAllRules
     * @borrows Schedule#deleteRule as Bulb.schedule#deleteRule
     * @borrows Schedule#setOverallEnable as Bulb.schedule#setOverallEnable
     * @borrows Schedule#getDayStats as Bulb.schedule#getDayStats
     * @borrows Schedule#getMonthStats as Bulb.schedule#getMonthStats
     * @borrows Schedule#eraseStats as Bulb.schedule#eraseStats
     */
    this.schedule = new Schedule(this, 'smartlife.iot.common.schedule');
    /**
     * @borrows Time#getTime as Bulb.time#getTime
     * @borrows Time#getTimezone as Bulb.time#getTimezone
     */
    this.time = new Time(this, 'smartlife.iot.common.timesetting');

    this.lastState = (0, _assign2.default)(this.lastState, { powerOn: null, inUse: null });

    if (sysInfo) {
      this.sysInfo = sysInfo;
    }
  }
  /**
   * Returns cached results from last retrieval of `system.sys_info`.
   * @return {Object} system.sys_info
   */
  get sysInfo() {
    return super.sysInfo;
  }
  /**
   * @private
   */
  set sysInfo(sysInfo) {
    super.sysInfo = sysInfo;
    // TODO / XXX Verify that sysInfo.light_state can be set here to trigger events
    this.lighting.lightState = sysInfo.light_state;
  }
  /**
   * Cached value of `sys_info.is_dimmable === 1`
   * @return {boolean}
   */
  get supportsBrightness() {
    return this.sysInfo.is_dimmable === 1;
  }
  /**
   * Cached value of `sys_info.is_color === 1`
   * @return {boolean}
   */
  get supportsColor() {
    return this.sysInfo.is_color === 1;
  }
  /**
   * Cached value of `sys_info.is_variable_color_temp === 1`
   * @return {boolean}
   */
  get supportsColorTemperature() {
    return this.sysInfo.is_variable_color_temp === 1;
  }
  /**
   * Returns array with min and max supported color temperatures
   * @return {?{min: Number, max: Number}} range
   */
  get getColorTemperatureRange() {
    if (!this.supportsColorTemperature) return;
    switch (true) {
      case /LB130/i.test(this.sysInfo.model):
        return { min: 2500, max: 9000 };
      default:
        return { min: 2700, max: 6500 };
    }
  }
  /**
   * Requests common Bulb status details in a single request.
   * - `system.get_sysinfo`
   * - `cloud.get_sysinfo`
   * - `emeter.get_realtime`
   * - `schedule.get_next_action`
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, Error>} parsed JSON response
   */
  getInfo(sendOptions) {
    var _this = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      var data;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _this.send(`{"${_this.apiModuleNamespace.emeter}":{"get_realtime":{}},"${_this.apiModuleNamespace.lightingservice}":{"get_light_state":{}},"${_this.apiModuleNamespace.schedule}":{"get_next_action":{}},"${_this.apiModuleNamespace.system}":{"get_sysinfo":{}},"${_this.apiModuleNamespace.cloud}":{"get_info":{}}}`, sendOptions);

            case 2:
              data = _context.sent;

              _this.sysInfo = data[_this.apiModuleNamespace.system].get_sysinfo;
              _this.cloud.info = data[_this.apiModuleNamespace.cloud].get_info;
              _this.emeter.realtime = data[_this.apiModuleNamespace.emeter].get_realtime;
              _this.schedule.nextAction = data[_this.apiModuleNamespace.schedule].get_next_action;
              _this.lighting.lightState = data[_this.apiModuleNamespace.lightingservice].get_light_state;
              return _context.abrupt('return', {
                sysInfo: _this.sysInfo,
                cloud: { info: _this.cloud.info },
                emeter: { realtime: _this.emeter.realtime },
                schedule: { nextAction: _this.schedule.nextAction },
                lighting: { lightState: _this.lighting.lightState }
              });

            case 9:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
  /**
   * Gets on/off state of Bulb.
   *
   * Requests `lightingservice.get_light_state` and returns true if `on_off === 1`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  getPowerState(sendOptions) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      var lightState;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return _this2.lighting.getLightState(sendOptions);

            case 2:
              lightState = _context2.sent;
              return _context2.abrupt('return', lightState.on_off === 1);

            case 4:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
  /**
   * Sets on/off state of Bulb.
   *
   * Sends `lightingservice.transition_light_state` command with on_off `value`.
   * @param  {boolean}     value          true: on, false: off
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  setPowerState(value, sendOptions) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              return _context3.abrupt('return', _this3.lighting.setLightState({ on_off: value ? 1 : 0 }, sendOptions));

            case 1:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3);
    }))();
  }
  /**
   * Toggles state of Bulb.
   *
   * Requests `lightingservice.get_light_state` sets the power state to the opposite of `on_off === 1` and returns the new power state.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  togglePowerState(sendOptions) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      var powerState;
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return _this4.getPowerState(sendOptions);

            case 2:
              powerState = _context4.sent;
              _context4.next = 5;
              return _this4.setPowerState(!powerState, sendOptions);

            case 5:
              return _context4.abrupt('return', !powerState);

            case 6:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this4);
    }))();
  }
}

module.exports = Bulb;