'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EventEmitter = require('events');

var Netif = require('./netif');

var _require = require('../utils'),
    ResponseError = _require.ResponseError;

/**
 * TP-Link Device.
 *
 * Shared behavior for {@link Plug} and {@link Bulb}.
 * @extends EventEmitter
 * @emits  Device#emeter-realtime-update
 */


class Device extends EventEmitter {
  /**
   * Created by {@link Client#getCommonDevice} - Do not instantiate directly
   * @param  {Object}       options
   * @param  {Client}       options.client
   * @param  {Object}       options.sysInfo
   * @param  {string}       options.host
   * @param  {number}      [options.port=9999]
   * @param  {Object}      [options.logger]
   * @param  {SendOptions} [options.defaultSendOptions]
   */
  constructor(_ref) {
    var client = _ref.client,
        sysInfo = _ref.sysInfo,
        host = _ref.host,
        _ref$port = _ref.port,
        port = _ref$port === undefined ? 9999 : _ref$port,
        logger = _ref.logger,
        _ref$defaultSendOptio = _ref.defaultSendOptions,
        defaultSendOptions = _ref$defaultSendOptio === undefined ? { transport: 'tcp', timeout: 5000 } : _ref$defaultSendOptio;

    super();

    this.client = client;
    this.host = host;
    this.port = port;
    this.defaultSendOptions = defaultSendOptions;
    this.log = logger || this.client.log;
    this.log.debug('device.constructor(%j)', (0, _assign2.default)({}, arguments[0], { client: 'not shown' }));

    this.lastState = {};

    this._sysInfo = {};

    if (sysInfo) {
      this.sysInfo = sysInfo;
    }

    this.netif = new Netif(this, 'netif');
  }
  /**
   * Returns cached results from last retrieval of `system.sys_info`.
   * @return {Object} system.sys_info
   */
  get sysInfo() {
    return this._sysInfo;
  }
  /**
   * @private
   */
  set sysInfo(sysInfo) {
    this.log.debug('[%s] device sysInfo set', sysInfo.alias || this.alias);
    this._sysInfo = sysInfo;
  }
  /**
   * Cached value of `sys_info.alias`
   * @return {string}
   */
  get alias() {
    return this.sysInfo.alias;
  }
  /**
   * Cached value of `sys_info.deviceId`
   * @return {string}
   */
  get deviceId() {
    return this.sysInfo.deviceId;
  }
  /**
   * Cached value of `sys_info.[description|dev_name]`
   * @return {string}
   */
  get description() {
    return this.sysInfo.description || this.sysInfo.dev_name;
  }
  /**
   * Cached value of `sys_info.model`
   * @return {string}
   */
  get model() {
    return this.sysInfo.model;
  }
  /**
   * Cached value of `sys_info.alias`
   * @return {string}
   */
  get name() {
    return this.alias;
  }
  /**
   * Cached value of `sys_info.[type|mic_type]``
   * @return {string}
   */
  get type() {
    return this.sysInfo.type || this.sysInfo.mic_type;
  }
  /**
   * Type of device (or device if unknown)
   *
   * Based on cached value of `sys_info.[type|mic_type]``
   * @return {string} 'plub'|'bulb'|'device'
   */
  get deviceType() {
    var type = this.type;
    switch (true) {
      case /plug/i.test(type):
        return 'plug';
      case /bulb/i.test(type):
        return 'bulb';
      default:
        return 'device';
    }
  }
  /**
   * Cached value of `sys_info.sw_ver`
   * @return {string}
   */
  get softwareVersion() {
    return this.sysInfo.sw_ver;
  }
  /**
   * Cached value of `sys_info.hw_ver`
   * @return {string}
   */
  get hardwareVersion() {
    return this.sysInfo.hw_ver;
  }
  /**
   * Cached value of `sys_info.[mac|mic_mac|ethernet_mac]``
   * @return {string}
   */
  get mac() {
    return this.sysInfo.mac || this.sysInfo.mic_mac || this.sysInfo.ethernet_mac;
  }
  /**
   * Sends `payload` to device (using {@link Client#send})
   * @param  {Object|string} payload
   * @param  {SendOptions}  [sendOptions]
   * @return {Promise<Object, Error>} parsed JSON response
   */
  send(payload, sendOptions) {
    var _this = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      var thisSendOptions;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _this.log.debug('[%s] device.send()', _this.alias);
              thisSendOptions = (0, _assign2.default)({}, _this.defaultSendOptions, sendOptions);
              return _context.abrupt('return', _this.client.send(payload, _this.host, _this.port, thisSendOptions).catch(function (reason) {
                _this.log.error('[%s] device.send() %s', _this.alias, reason);
                _this.log.debug(payload);
                throw reason;
              }));

            case 3:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
  /**
   * Sends command(s) to device.
   *
   * Calls {@link #send} and processes the response.
   *
   * - If only one operation was sent:
   *   - Promise fulfills with specific parsed JSON response for command.\
   *     Example: `{system:{get_sysinfo:{}}}`
   *     - resolves to: `{err_code:0,...}`\
   *     - instead of: `{system:{get_sysinfo:{err_code:0,...}}}` (as {@link #send} would)
   * - If more than one operation was sent:
   *   - Promise fulfills with full parsed JSON response (same as {@link #send})
   *
   * Also, the response's `err_code`(s) are checked, if any are missing or != `0` the Promise is rejected with {@link ResponseError}.
   * @param  {Object|string} command
   * @param  {SendOptions}  [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  sendCommand(command, sendOptions) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      var commandObj, response, results;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              // TODO allow certain err codes (particually emeter for non HS110 devices)
              commandObj = typeof command === 'string' || command instanceof String ? JSON.parse(command) : command;
              _context2.next = 3;
              return _this2.send(commandObj, sendOptions);

            case 3:
              response = _context2.sent;
              results = processResponse(commandObj, response);
              return _context2.abrupt('return', results);

            case 6:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
  /**
   * Polls the device every `interval`.
   *
   * Returns `this` (for chaining) that emits events based on state changes.
   * Refer to specific device sections for event details.
   * @param  {number} interval (ms)
   * @return {Device|Bulb|Plug}          this
   */
  startPolling(interval) {
    var _this3 = this;

    // TODO
    this.pollingTimer = setInterval(function () {
      _this3.getInfo();
    }, interval);
    return this;
  }
  /**
   * Stops device polling.
   */
  stopPolling() {
    clearInterval(this.pollingTimer);
    this.pollingTimer = null;
  }
  /**
   * Gets device's SysInfo.
   *
   * Requests `system.sys_info` from device.
   * @param  {SendOptions}  [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getSysInfo(sendOptions) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _this4.log.debug('[%s] device.getSysInfo()', _this4.alias);
              _context3.next = 3;
              return _this4.sendCommand('{"system":{"get_sysinfo":{}}}', sendOptions);

            case 3:
              _this4.sysInfo = _context3.sent;
              return _context3.abrupt('return', _this4.sysInfo);

            case 5:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this4);
    }))();
  }
  /**
   * Change device's alias (name).
   *
   * Sends `system.set_dev_alias` command.
   * @param  {string}       alias
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  setAlias(alias, sendOptions) {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return _this5.sendCommand({
                [_this5.apiModuleNamespace.system]: { set_dev_alias: { alias: alias } }
              }, sendOptions);

            case 2:
              _this5.sysInfo.alias = alias;
              return _context4.abrupt('return', true);

            case 4:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this5);
    }))();
  }
  /**
   * Set device's location.
   *
   * Sends `system.set_dev_location` command.
   * @param  {number}       latitude
   * @param  {number}       longitude
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  setLocation(latitude, longitude, sendOptions) {
    var _this6 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
      var latitude_i, longitude_i;
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              latitude_i = Math.round(latitude * 10000); // eslint-disable-line camelcase

              longitude_i = Math.round(longitude * 10000); // eslint-disable-line camelcase

              return _context5.abrupt('return', _this6.sendCommand({
                [_this6.apiModuleNamespace.system]: {
                  set_dev_location: { latitude, longitude, latitude_i, longitude_i }
                }
              }, sendOptions));

            case 3:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this6);
    }))();
  }
  /**
   * Gets device's model.
   *
   * Requests `system.sys_info` and returns model name.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getModel(sendOptions) {
    var _this7 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6() {
      var sysInfo;
      return _regenerator2.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return _this7.getSysInfo(sendOptions);

            case 2:
              sysInfo = _context6.sent;
              return _context6.abrupt('return', sysInfo.model);

            case 4:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, _this7);
    }))();
  }
  /**
   * Reboot device.
   *
   * Sends `system.reboot` command.
   * @param  {number}       delay
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  reboot(delay, sendOptions) {
    var _this8 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee7() {
      return _regenerator2.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              return _context7.abrupt('return', _this8.sendCommand({
                [_this8.apiModuleNamespace.system]: { reboot: { delay } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, _this8);
    }))();
  }
  /**
   * Reset device.
   *
   * Sends `system.reset` command.
   * @param  {number}       delay
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  reset(delay, sendOptions) {
    var _this9 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee8() {
      return _regenerator2.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              return _context8.abrupt('return', _this9.sendCommand({
                [_this9.apiModuleNamespace.system]: { reset: { delay } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, _this9);
    }))();
  }
}

/**
 * @private
 */
function processResponse(command, response) {
  var commandResponses = recur(command, response);

  var errors = [];
  commandResponses.forEach(function (r) {
    if (r.err_code == null) {
      errors.push({ msg: 'err_code missing', response: r });
    } else if (r.err_code !== 0) {
      errors.push({ msg: 'err_code not zero', response: r });
    }
  });

  if (errors.length === 1) {
    throw new ResponseError(errors[0].msg, errors[0].response);
  } else if (errors.length > 1) {
    throw new ResponseError('err_code', response);
  }

  if (commandResponses.length === 1) {
    return commandResponses[0];
  }
  return response;

  function recur(command, response) {
    var depth = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var results = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

    var keys = (0, _keys2.default)(command);
    if (keys.length === 0) {
      results.push(response);
    }
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (depth === 1) {
        if (response[key]) {
          results.push(response[key]);
        } else {
          return results.push(response);
        }
      } else if (depth < 1) {
        if (response[key] !== undefined) {
          recur(command[key], response[key], depth + 1, results);
        }
      }
    }
    return results;
  }
}

module.exports = Device;