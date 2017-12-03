'use strict';

/**
 * Netif
 */

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Netif {
  constructor(device, apiModuleName) {
    this.device = device;
    this.apiModuleName = apiModuleName;
  }
  /**
   * Requests `netif.get_scaninfo` (list of WiFi networks).
   *
   * Note that `timeoutInSeconds` is sent in the request and is not the actual network timeout.
   * The network timeout for the request is calculated by adding the
   * default network timeout to `timeoutInSeconds`.
   * @param  {Boolean}     [refresh=false]       request device's cached results
   * @param  {number}      [timeoutInSeconds=10] timeout for scan in seconds
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getScanInfo() {
    var refresh = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    var _this = this;

    var timeoutInSeconds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 10;
    var sendOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (sendOptions.timeout == null) {
                sendOptions.timeout = timeoutInSeconds * 1000 * 2 + (_this.device.defaultSendOptions.timeout || 5000);
              }
              return _context.abrupt('return', _this.device.sendCommand({
                [_this.apiModuleName]: {
                  get_scaninfo: {
                    refresh: refresh ? 1 : 0,
                    timeout: timeoutInSeconds
                  }
                }
              }, sendOptions));

            case 2:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
}

module.exports = Netif;