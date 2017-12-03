'use strict';

/**
 * Cloud
 */

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Cloud {
  constructor(device, apiModuleName) {
    this.device = device;
    this.apiModuleName = apiModuleName;
  }
  /**
   * Gets device's TP-Link cloud info.
   *
   * Requests `cloud.get_info`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getInfo(sendOptions) {
    var _this = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _this.device.sendCommand({
                [_this.apiModuleName]: { get_info: {} }
              }, sendOptions);

            case 2:
              _this.info = _context.sent;
              return _context.abrupt('return', _this.info);

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
  /**
   * Add device to TP-Link cloud.
   *
   * Sends `cloud.bind` command.
   * @param  {string}       username
   * @param  {string}       password
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  bind(username, password, sendOptions) {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              return _context2.abrupt('return', _this2.device.sendCommand({
                [_this2.apiModuleName]: { bind: { username, password } }
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
   * Remove device from TP-Link cloud.
   *
   * Sends `cloud.unbind` command.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  unbind(sendOptions) {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              return _context3.abrupt('return', _this3.device.sendCommand({
                [_this3.apiModuleName]: { unbind: {} }
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
   * Remove device from TP-Link cloud.
   *
   * Sends `cloud.get_intl_fw_list` command.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getFirmwareList(sendOptions) {
    var _this4 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              return _context4.abrupt('return', _this4.device.sendCommand({
                [_this4.apiModuleName]: { get_intl_fw_list: {} }
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
   * Sets device's TP-Link cloud server URL.
   *
   * Sends `cloud.set_server_url` command.
   * @param  {string}       server URL
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  setServerUrl(server, sendOptions) {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5() {
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              return _context5.abrupt('return', _this5.device.sendCommand({
                [_this5.apiModuleName]: { set_server_url: { server } }
              }, sendOptions));

            case 1:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this5);
    }))();
  }
}

module.exports = Cloud;