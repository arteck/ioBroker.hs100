'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Device = require('../device');
var Away = require('./away');
var Cloud = require('../shared/cloud');
var Emeter = require('../shared/emeter');
var Schedule = require('./schedule');
var Timer = require('./timer');
var Time = require('../shared/time');

/**
 * Plug Device.
 *
 * TP-Link models: HS100, HS105, HS110, HS200.
 *
 * Emits events after device status is queried, such as {@link #getSysInfo} and {@link #getEmeterRealtime}.
 * @extends Device
 * @extends EventEmitter
 * @emits  Plug#power-on
 * @emits  Plug#power-off
 * @emits  Plug#power-update
 * @emits  Plug#in-use
 * @emits  Plug#not-in-use
 * @emits  Plug#in-use-update
 * @emits  Plug#emeter-realtime-update
 */
class Plug extends Device {
  /**
   * Created by {@link Client} - Do not instantiate directly.
   *
   * See {@link Device#constructor} for common options.
   * @param  {Object}  options
   * @param  {Number} [options.inUseThreshold=0]
   */
  constructor(options) {
    super(options);

    this.log.debug('plug.constructor()');

    this.apiModuleNamespace = {
      'system': 'system',
      'cloud': 'cnCloud',
      'schedule': 'schedule',
      'timesetting': 'time',
      'emeter': 'emeter',
      'netif': 'netif'
    };

    this.inUseThreshold = options.inUseThreshold || 0;

    this.emitEventsEnabled = true;

    /**
     * @borrows Away#getRules as Plug.away#getRules
     * @borrows Away#addRule as Plug.away#addRule
     * @borrows Away#editRule as Plug.away#editRule
     * @borrows Away#deleteAllRules as Plug.away#deleteAllRules
     * @borrows Away#deleteRule as Plug.away#deleteRule
     * @borrows Away#setOverallEnable as Plug.away#setOverallEnable
     */
    this.away = new Away(this, 'anti_theft');
    /**
     * @borrows Cloud#getInfo as Plug.cloud#getInfo
     * @borrows Cloud#bind as Plug.cloud#bind
     * @borrows Cloud#unbind as Plug.cloud#unbind
     * @borrows Cloud#getFirmwareList as Plug.cloud#getFirmwareList
     * @borrows Cloud#setServerUrl as Plug.cloud#setServerUrl
     */
    this.cloud = new Cloud(this, 'cnCloud');
    /**
     * @borrows Emeter#realtime as Plug.emeter#realtime
     * @borrows Emeter#getRealtime as Plug.emeter#getRealtime
     * @borrows Emeter#getDayStats as Plug.emeter#getDayStats
     * @borrows Emeter#getMonthStats as Plug.emeter#getMonthStats
     * @borrows Emeter#eraseStats as Plug.emeter#eraseStats
     */
    this.emeter = new Emeter(this, 'emeter');
    /**
     * @borrows Schedule#getNextAction as Plug.schedule#getNextAction
     * @borrows Schedule#getRules as Plug.schedule#getRules
     * @borrows Schedule#getRule as Plug.schedule#getRule
     * @borrows PlugSchedule#addRule as Plug.schedule#addRule
     * @borrows PlugSchedule#editRule as Plug.schedule#editRule
     * @borrows Schedule#deleteAllRules as Plug.schedule#deleteAllRules
     * @borrows Schedule#deleteRule as Plug.schedule#deleteRule
     * @borrows Schedule#setOverallEnable as Plug.schedule#setOverallEnable
     * @borrows Schedule#getDayStats as Plug.schedule#getDayStats
     * @borrows Schedule#getMonthStats as Plug.schedule#getMonthStats
     * @borrows Schedule#eraseStats as Plug.schedule#eraseStats
     */
    this.schedule = new Schedule(this, 'schedule');
    /**
     * @borrows Time#getTime as Plug.time#getTime
     * @borrows Time#getTimezone as Plug.time#getTimezone
     */
    this.time = new Time(this, 'time');
    /**
     * @borrows Timer#getRules as Plug.timer#getRules
     * @borrows Timer#addRule as Plug.timer#addRule
     * @borrows Timer#editRule as Plug.timer#editRule
     * @borrows Timer#deleteAllRules as Plug.timer#deleteAllRules
     */
    this.timer = new Timer(this, 'count_down');

    if (this.sysInfo) {
      this.lastState.inUse = this.inUse;
      this.lastState.relayState = this.relayState;
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
    this.supportsEmeter = sysInfo.feature && typeof sysInfo.feature === 'string' ? sysInfo.feature.indexOf('ENE') >= 0 : false;
    this.log.debug('[%s] plug sysInfo set', this.alias);
    this.emitEvents();
  }
  /**
   * Returns cached results from last retrieval of `emeter.get_realtime`.
   * @return {Object}
   */
  // get emeterRealtime () {
  //   return super.emeterRealtime;
  // }
  // /**
  //  * @private
  //  */
  // set emeterRealtime (emeterRealtime) {
  //   this.log.debug('[%s] plug emeterRealtime set, supportsEmeter: %s', this.alias, this.supportsEmeter);
  //   if (this.supportsEmeter) {
  //     super.emeterRealtime = emeterRealtime;
  //     this.emitEvents();
  //   }
  // }
  /**
   * Determines if device is in use based on cached `emeter.get_realtime` results.
   *
   * If device supports energy monitoring (HS110): `power > inUseThreshold`
   *
   * Otherwise fallback on relay state:  `relay_state === 1`
   * @return {boolean}
   */
  get inUse() {
    if (this.supportsEmeter) {
      return this.emeter.realtime.power > this.inUseThreshold;
    }
    return this.relayState;
  }
  /**
   * `sys_info.relay_state === 1`
   * @return {boolean}
   */
  get relayState() {
    return this.sysInfo.relay_state === 1;
  }
  /**
   * Requests common Plug status details in a single request.
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
              return _this.send('{"emeter":{"get_realtime":{}},"schedule":{"get_next_action":{}},"system":{"get_sysinfo":{}},"cnCloud":{"get_info":{}}}', sendOptions);

            case 2:
              data = _context.sent;

              _this.sysInfo = data.system.get_sysinfo;
              _this.cloud.info = data.cnCloud.get_info;
              _this.emeter.realtime = data.emeter.get_realtime;
              _this.schedule.nextAction = data.schedule.get_next_action;
              return _context.abrupt('return', {
                sysInfo: _this.sysInfo,
                cloud: { info: _this.cloud.info },
                emeter: { realtime: _this.emeter.realtime },
                schedule: { nextAction: _this.schedule.nextAction }
              });

            case 8:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }

  /**
   * Same as {@link #inUse}, but requests current `emeter.get_realtime`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  getInUse(sendOptions) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!_this2.supportsEmeter) {
                _context2.next = 5;
                break;
              }

              _context2.next = 3;
              return _this2.emeter.getRealtime(sendOptions);

            case 3:
              _context2.next = 7;
              break;

            case 5:
              _context2.next = 7;
              return _this2.getSysInfo(sendOptions);

            case 7:
              return _context2.abrupt('return', _this2.inUse);

            case 8:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
  /**
   * Get Plug LED state (night mode).
   *
   * Requests `system.sys_info` and returns true if `led_off === 0`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>} LED State, true === on
   */
  getLedState(sendOptions) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      var sysInfo;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return _this3.getSysInfo(sendOptions);

            case 2:
              sysInfo = _context3.sent;
              return _context3.abrupt('return', sysInfo.led_off === 0);

            case 4:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this3);
    }))();
  }
  /**
   * Turn Plug LED on/off (night mode).
   *
   * Sends `system.set_led_off` command.
   * @param  {boolean}      value LED State, true === on
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  setLedState(value, sendOptions) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return _this4.sendCommand(`{"system":{"set_led_off":{"off":${value ? 0 : 1}}}}`, sendOptions);

            case 2:
              _this4.sysInfo.set_led_off = value ? 0 : 1;
              return _context4.abrupt('return', true);

            case 4:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this4);
    }))();
  }
  /**
   * Get Plug relay state (on/off).
   *
   * Requests `system.get_sysinfo` and returns true if `relay_state === 1`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  getPowerState(sendOptions) {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
      var sysInfo;
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return _this5.getSysInfo(sendOptions);

            case 2:
              sysInfo = _context5.sent;
              return _context5.abrupt('return', sysInfo.relay_state === 1);

            case 4:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this5);
    }))();
  }
  /**
   * Turns Plug relay on/off.
   *
   * Sends `system.set_relay_state` command.
   * @param  {boolean}      value
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  setPowerState(value, sendOptions) {
    var _this6 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
      return _regenerator2.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return _this6.sendCommand(`{"system":{"set_relay_state":{"state":${value ? 1 : 0}}}}`, sendOptions);

            case 2:
              _this6.sysInfo.relay_state = value ? 1 : 0;
              _this6.emitEvents();
              return _context6.abrupt('return', true);

            case 5:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, _this6);
    }))();
  }
  /**
   * Toggles Plug relay state.
   *
   * Requests `system.get_sysinfo` sets the power state to the opposite `relay_state === 1 and return the new power state`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  togglePowerState(sendOptions) {
    var _this7 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
      var powerState;
      return _regenerator2.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return _this7.getPowerState(sendOptions);

            case 2:
              powerState = _context7.sent;
              _context7.next = 5;
              return _this7.setPowerState(!powerState, sendOptions);

            case 5:
              return _context7.abrupt('return', !powerState);

            case 6:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, _this7);
    }))();
  }
  /**
   * Blink Plug LED.
   *
   * Sends `system.set_led_off` command alternating on and off number of `times` at `rate`,
   * then sets the led to its pre-blink state.
   *
   * Note: `system.set_led_off` is particulally slow, so blink rate is not guaranteed.
   * @param  {number}      [times=5]
   * @param  {number}      [rate=1000]
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  blink() {
    var times = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 5;

    var _this8 = this;

    var rate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1000;
    var sendOptions = arguments[2];
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8() {
      var delay, origLedState, lastBlink, currLedState, i, timeToWait;
      return _regenerator2.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              delay = function delay(t) {
                return new _promise2.default(function (resolve) {
                  setTimeout(resolve, t);
                });
              };

              _context8.next = 3;
              return _this8.getLedState(sendOptions);

            case 3:
              origLedState = _context8.sent;
              lastBlink = Date.now();
              currLedState = false;
              i = 0;

            case 7:
              if (!(i < times * 2)) {
                _context8.next = 19;
                break;
              }

              currLedState = !currLedState;
              lastBlink = Date.now();
              _context8.next = 12;
              return _this8.setLedState(currLedState, sendOptions);

            case 12:
              timeToWait = rate / 2 - (Date.now() - lastBlink);

              if (!(timeToWait > 0)) {
                _context8.next = 16;
                break;
              }

              _context8.next = 16;
              return delay(timeToWait);

            case 16:
              i++;
              _context8.next = 7;
              break;

            case 19:
              if (!(currLedState !== origLedState)) {
                _context8.next = 22;
                break;
              }

              _context8.next = 22;
              return _this8.setLedState(origLedState, sendOptions);

            case 22:
              return _context8.abrupt('return', true);

            case 23:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, _this8);
    }))();
  }
  /**
   * Plug's relay was turned on.
   * @event Plug#power-on
   */
  /**
   * Plug's relay was turned off.
   * @event Plug#power-off
   */
  /**
   * Plug's relay state was updated from device. Fired regardless if status was changed.
   * @event Plug#power-update
   * @property {boolean} value Relay State
   */
  /**
   * Plug's relay was turned on _or_ power draw exceeded `inUseThreshold` for HS110
   * @event Plug#in-use
   */
  /**
   * Plug's relay was turned off _or_ power draw fell below `inUseThreshold` for HS110
   * @event Plug#not-in-use
   */
  /**
   * Plug's in-use state was updated from device. Fired regardless if status was changed.
   * @event Plug#in-use-update
   * @property {boolean} value In Use State
   */
  /**
   * Plug's Energy Monitoring Details were updated from device. Fired regardless if status was changed.
   * @event Plug#emeter-realtime-update
   * @property {Object} value emeterRealtime
   */
  /**
   * @private
   */
  emitEvents() {
    if (!this.emitEventsEnabled) {
      return;
    }

    var inUse = this.inUse;
    var relayState = this.relayState;

    this.log.debug('[%s] plug.emitEvents() inUse: %s relayState: %s lastState: %j', this.alias, inUse, relayState, this.lastState);
    if (this.lastState.inUse !== inUse) {
      this.lastState.inUse = inUse;
      if (inUse) {
        this.emit('in-use');
      } else {
        this.emit('not-in-use');
      }
    }
    this.emit('in-use-update', inUse);

    if (this.lastState.relayState !== relayState) {
      this.lastState.relayState = relayState;
      if (relayState) {
        this.emit('power-on');
      } else {
        this.emit('power-off');
      }
    }
    this.emit('power-update', relayState);
  }
}

module.exports = Plug;