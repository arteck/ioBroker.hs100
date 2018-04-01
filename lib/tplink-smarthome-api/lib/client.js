'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dgram = require('dgram');
var net = require('net');
var EventEmitter = require('events');

var _require = require('tplink-smarthome-crypto'),
    encrypt = _require.encrypt,
    encryptWithHeader = _require.encryptWithHeader,
    decrypt = _require.decrypt;

var Device = require('./device');
var Plug = require('./plug');
var Bulb = require('./bulb');

var discoveryMsgBuf = encrypt('{"system":{"get_sysinfo":{}}}');
var maxSocketId = 0;

/**
 * Send Options.
 *
 * @typedef {Object} SendOptions
 * @property {number} timeout  (ms)
 * @property {string} transport 'tcp','udp'
 */

/**
 * Client that sends commands to specified devices or discover devices on the local subnet.
 * - Contains factory methods to create devices.
 * - Events are emitted after {@link #startDiscovery} is called.
 * @extends EventEmitter
 */
class Client extends EventEmitter {
  /**
   * @param  {Object}       options
   * @param  {SendOptions} [options.defaultSendOptions]
   * @param  {Number}      [options.defaultSendOptions.timeout=5000]  (ms)
   * @param  {string}      [options.defaultSendOptions.transport=tcp] 'tcp' or 'udp'
   * @param  {string}      [options.logLevel]       level for built in logger ['error','warn','info','debug','trace']
   */
  constructor() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$defaultSendOptio = _ref.defaultSendOptions,
        defaultSendOptions = _ref$defaultSendOptio === undefined ? { timeout: 5000, transport: 'tcp' } : _ref$defaultSendOptio,
        logLevel = _ref.logLevel,
        logger = _ref.logger;

    super();
    this.defaultSendOptions = defaultSendOptions;
    this.log = require('./logger')({ level: logLevel, logger: logger });

    this.devices = new _map2.default();
    this.discoveryTimer = null;
    this.discoveryPacketSequence = 0;
  }
  /**
   * {@link https://github.com/plasticrake/tplink-smarthome-crypto Encrypts} `payload` and sends to device.
   * - If `payload` is not a string, it is `JSON.stringify`'d.
   * - Promise fulfills with parsed JSON response.
   *
   * Devices use JSON to communicate.\
   * For Example:
   * - If a device receives:
   *   - `{"system":{"get_sysinfo":{}}}`
   * - It responds with:
   *   - `{"system":{"get_sysinfo":{
   *       err_code: 0,
   *       sw_ver: "1.0.8 Build 151113 Rel.24658",
   *       hw_ver: "1.0",
   *       ...
   *     }}}`
   *
   * All responses from device contain an `err_code` (`0` is success).
   *
   * @param  {Object|string}  payload
   * @param  {string}         host
   * @param  {number}        [port=9999]
   * @param  {SendOptions}   [sendOptions]
   * @return {Promise<Object, Error>}
   */
  send(payload, host) {
    var _this = this;

    var port = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 9999;
    var sendOptions = arguments[3];
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      var thisSendOptions;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              thisSendOptions = (0, _assign2.default)({}, _this.defaultSendOptions, sendOptions);

              if (!(thisSendOptions.transport === 'udp')) {
                _context.next = 3;
                break;
              }

              return _context.abrupt('return', _this.sendUdp(payload, host, port, thisSendOptions.timeout));

            case 3:
              return _context.abrupt('return', _this.sendTcp(payload, host, port, thisSendOptions.timeout));

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
  /**
   * @private
   */
  sendUdp(payload, host) {
    var _this2 = this;

    var port = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 9999;
    var timeout = arguments[3];
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      var socketId;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              socketId = maxSocketId += 1;

              _this2.log.debug(`[${socketId}] client.sendUdp(%j)`, { payload, host, port, timeout });

              return _context2.abrupt('return', new _promise2.default(function (resolve, reject) {
                var socket = void 0;
                var isSocketBound = false;
                try {
                  var payloadString = !(typeof payload === 'string' || payload instanceof String) ? (0, _stringify2.default)(payload) : payload;

                  socket = dgram.createSocket('udp4');

                  var timer = void 0;
                  if (timeout > 0) {
                    timer = setTimeout(function () {
                      _this2.log.debug(`[${socketId}] client.sendUdp(): timeout(${timeout})`);
                      _this2.log.error('UDP Timeout');
                      if (isSocketBound) socket.close();
                      reject(new Error('UDP Timeout'));
                    }, timeout);
                  }

                  socket.on('message', function (msg, rinfo) {
                    clearTimeout(timer);
                    _this2.log.debug(`[${socketId}] client.sendUdp(): socket:data %j`, rinfo);
                    if (isSocketBound) socket.close();

                    var decryptedMsg = void 0;
                    try {
                      decryptedMsg = decrypt(msg).toString('utf8');
                      _this2.log.debug(`[${socketId}] client.sendUdp(): socket:data message: ${decryptedMsg}`);
                      var msgObj = '';
                      if (decryptedMsg !== '') {
                        msgObj = JSON.parse(decryptedMsg);
                      }
                      resolve(msgObj);
                    } catch (err) {
                      _this2.log.error('Error parsing JSON: %s\nFrom: [%s UDP] Original: [%s] Decrypted: [%s]', err, rinfo, msg, decryptedMsg);
                      reject(err);
                    }
                  });

                  socket.on('error', function (err) {
                    _this2.log.debug(`[${socketId}] client.sendUdp(): socket:error`, err);
                    if (isSocketBound) socket.close();
                    reject(err);
                  });

                  _this2.log.debug(`[${socketId}] client.sendUdp(): attempting to open. host:${host}, port:${port}`);
                  socket.bind(function () {
                    isSocketBound = true;
                    _this2.log.debug(`[${socketId}] client.sendUdp(): listening on %j`, socket.address());
                    var msgBuf = encrypt(payloadString);
                    socket.send(msgBuf, 0, msgBuf.length, port, host);
                  });
                } catch (err) {
                  _this2.log.error(`UDP Error: %s`, err);
                  if (isSocketBound) socket.close();
                  reject(err);
                }
              }));

            case 3:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
  /**
   * @private
   */
  sendTcp(payload, host) {
    var _this3 = this;

    var port = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 9999;
    var timeout = arguments[3];

    var socketId = maxSocketId += 1;
    this.log.debug(`[${socketId}] client.sendTcp(%j)`, { payload, host, port, timeout });

    return new _promise2.default(function (resolve, reject) {
      var socket = void 0;
      var timer = void 0;
      var deviceDataBuf = void 0;
      var segmentCount = 0;
      try {
        var payloadString = !(typeof payload === 'string' || payload instanceof String) ? (0, _stringify2.default)(payload) : payload;

        socket = new net.Socket();

        if (timeout > 0) {
          timer = setTimeout(function () {
            _this3.log.debug(`[${socketId}] client.sendTcp(): timeout(${timeout})`);
            _this3.log.error('TCP Timeout');
            socket.destroy();
            reject(new Error('TCP Timeout'));
          }, timeout);
        }

        socket.on('data', function (data) {
          segmentCount += 1;
          _this3.log.debug(`[${socketId}] client.sendTcp(): socket:data ${socket.remoteAddress}:${socket.remotePort} segment:${segmentCount}`);

          if (deviceDataBuf === undefined) {
            deviceDataBuf = data;
          } else {
            deviceDataBuf = Buffer.concat([deviceDataBuf, data], deviceDataBuf.length + data.length);
          }

          var expectedMsgLen = deviceDataBuf.slice(0, 4).readInt32BE();
          var actualMsgLen = deviceDataBuf.length - 4;

          if (actualMsgLen >= expectedMsgLen) {
            socket.end();
          }
        });

        socket.on('close', function () {
          _this3.log.debug(`[${socketId}] client.sendTcp(): socket:close`);
          clearTimeout(timer);

          if (deviceDataBuf == null) return;

          var expectedMsgLen = deviceDataBuf.slice(0, 4).readInt32BE();
          var actualMsgLen = deviceDataBuf.length - 4;

          if (actualMsgLen >= expectedMsgLen) {
            var decryptedMsg = void 0;
            try {
              decryptedMsg = decrypt(deviceDataBuf.slice(4)).toString('utf8');
              _this3.log.debug(`[${socketId}] client.sendTcp(): socket:close message: ${decryptedMsg}`);
              var msgObj = '';
              if (decryptedMsg !== '') {
                msgObj = JSON.parse(decryptedMsg);
              }
              resolve(msgObj);
            } catch (err) {
              _this3.log.error(`Error parsing JSON: %s\nFrom: [${socket.remoteAddress} ${socket.remotePort}] TCP ${segmentCount} ${actualMsgLen}/${expectedMsgLen} Original: [%s] Decrypted: [${decryptedMsg}]`, err, deviceDataBuf);
              reject(err);
            }
          }
        });

        socket.on('error', function (err) {
          _this3.log.debug(`[${socketId}] client.sendTcp(): socket:error`);
          socket.destroy();
          reject(err);
        });

        _this3.log.debug(`[${socketId}] client.sendTcp(): attempting to open. host:${host}, port:${port}`);
        socket.connect({ port, host }, function () {
          _this3.log.debug(`[${socketId}] client.sendTcp(): socket:connect ${socket.remoteAddress} ${socket.remotePort}`);
          socket.write(encryptWithHeader(payloadString));
        });
      } catch (err) {
        clearTimeout(timer);
        _this3.log.error(`TCP Error: ${err}`);
        socket.destroy();
        reject(err);
      }
    });
  }
  /**
   * Requests `{system:{get_sysinfo:{}}}` from device.
   *
   * @param  {string}       host
   * @param  {number}      [port=9999]
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, Error>} parsed JSON response
   */
  getSysInfo(host) {
    var _this4 = this;

    var port = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 9999;
    var sendOptions = arguments[2];
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3() {
      var data;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _this4.log.debug('client.getSysInfo(%j)', { host, port, sendOptions });
              _context3.next = 3;
              return _this4.send('{"system":{"get_sysinfo":{}}}', host, port, sendOptions);

            case 3:
              data = _context3.sent;
              return _context3.abrupt('return', data.system.get_sysinfo);

            case 5:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this4);
    }))();
  }
  /**
   * @private
   */
  emit(eventName) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    // Add device- / plug- / bulb- to eventName
    if (args[0] instanceof Device) {
      super.emit.apply(this, ['device-' + eventName].concat(args));
      if (args[0].deviceType !== 'device') {
        super.emit.apply(this, [args[0].deviceType + '-' + eventName].concat(args));
      }
    } else {
      super.emit.apply(this, [eventName].concat(args));
    }
  }
  /**
   * Creates Bulb object.
   *
   * See {@link Device#constructor} and {@link Bulb#constructor} for valid options.
   * @param  {Object} deviceOptions passed to {@link Bulb#constructor}
   * @return {Bulb}
   */
  getBulb(deviceOptions) {
    return new Bulb((0, _assign2.default)({}, deviceOptions, { client: this, defaultSendOptions: this.defaultSendOptions }));
  }
  /**
   * Creates {@link Plug} object.
   *
   * See {@link Device#constructor} and {@link Plug#constructor} for valid options.
   * @param  {Object} deviceOptions passed to {@link Plug#constructor}
   * @return {Plug}
   */
  getPlug(deviceOptions) {
    return new Plug((0, _assign2.default)({}, deviceOptions, { client: this, defaultSendOptions: this.defaultSendOptions }));
  }
  /**
   * Creates a {@link Plug} or {@link Bulb} after querying device to determine type.
   *
   * See {@link Device#constructor}, {@link Bulb#constructor}, {@link Plug#constructor} for valid options.
   * @param  {Object}      deviceOptions passed to {@link Device#constructor}
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Plug|Bulb, Error>}
   */
  getDevice(deviceOptions, sendOptions) {
    var _this5 = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4() {
      var sysInfo;
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return _this5.getSysInfo(deviceOptions.host, deviceOptions.port, sendOptions);

            case 2:
              sysInfo = _context4.sent;
              return _context4.abrupt('return', _this5.getDeviceFromSysInfo(sysInfo, (0, _assign2.default)({}, deviceOptions, { client: _this5 })));

            case 4:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this5);
    }))();
  }
  /**
   * Create {@link Device} object.
   * - Device object only supports common Device methods.
   * - See {@link Device#constructor} for valid options.
   * - Instead use {@link #getDevice} to create a fully featured object.
   * @param  {Object} deviceOptions passed to {@link Device#constructor}
   * @return {Device}
   */
  getCommonDevice(deviceOptions) {
    return new Device((0, _assign2.default)({}, deviceOptions, { client: this, defaultSendOptions: this.defaultSendOptions }));
  }
  /**
   * @private
   */
  getDeviceFromType(typeName, deviceOptions) {
    if (typeof typeName === 'function') {
      typeName = typeName.name;
    }
    switch (typeName.toLowerCase()) {
      case 'plug':
        return this.getPlug(deviceOptions);
      case 'bulb':
        return this.getBulb(deviceOptions);
      default:
        return this.getPlug(deviceOptions);
    }
  }
  /**
   * Creates device corresponding to the provided `sysInfo`.
   *
   * See {@link Device#constructor}, {@link Bulb#constructor}, {@link Plug#constructor} for valid options
   * @param  {Object} sysInfo
   * @param  {Object} deviceOptions passed to device constructor
   * @return {Plug|Bulb}
   */
  getDeviceFromSysInfo(sysInfo, deviceOptions) {
    var thisDeviceOptions = (0, _assign2.default)({}, deviceOptions, { sysInfo: sysInfo });
    switch (this.getTypeFromSysInfo(sysInfo)) {
      case 'plug':
        return this.getPlug(thisDeviceOptions);
      case 'bulb':
        return this.getBulb(thisDeviceOptions);
      default:
        return this.getPlug(thisDeviceOptions);
    }
  }
  /**
   * Guess the device type from provided `sysInfo`.
   *
   * Based on sys_info.[type|mic_type]
   * @param  {Object} sysInfo
   * @return {string}         'plug','bulb','device'
   */
  getTypeFromSysInfo(sysInfo) {
    var type = sysInfo.type || sysInfo.mic_type || '';
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
   * First response from device.
   * @event Client#device-new
   * @property {Device|Bulb|Plug}
   */
  /**
   * Follow up response from device.
   * @event Client#device-online
   * @property {Device|Bulb|Plug}
   */
  /**
   * No response from device.
   * @event Client#device-offline
   * @property {Device|Bulb|Plug}
   */
  /**
   * First response from Bulb.
   * @event Client#bulb-new
   * @property {Bulb}
   */
  /**
   * Follow up response from Bulb.
   * @event Client#bulb-online
   * @property {Bulb}
   */
  /**
   * No response from Bulb.
   * @event Client#bulb-offline
   * @property {Bulb}
   */
  /**
   * First response from Plug.
   * @event Client#plug-new
   * @property {Plug}
   */
  /**
   * Follow up response from Plug.
   * @event Client#plug-online
   * @property {Plug}
   */
  /**
   * No response from Plug.
   * @event Client#plug-offline
   * @property {Plug}
   */
  /**
   * Invalid/Unknown response from device.
   * @event Client#discovery-invalid
   * @property {Object} rinfo
   * @property {Buffer} response
   * @property {Buffer} decryptedResponse
   */
  /**
   * Error during discovery.
   * @event Client#error
   * @type {Object}
   * @property {Error}
   */
  /**
   * Discover TP-Link Smarthome devices on the network.
   *
   * - Sends a discovery packet (via UDP) to the `broadcast` address every `discoveryInterval`(ms).
   * - Stops discovery after `discoveryTimeout`(ms) (if `0`, runs until {@link #stopDiscovery} is called).
   *   - If a device does not respond after `offlineTolerance` number of attempts, {@link event:Client#device-offline} is emitted.
   * - If `deviceTypes` are specified only matching devices are found.
   * - If `macAddresses` are specified only matching device with matching MAC addresses are found.
   * - If `devices` are specified it will attempt to contact them directly in addition to sending to the broadcast address.
   *   - `devices` are specified as an array of `[{host, [port: 9999]}]`.
   * @param  {Object}    options
   * @param  {string}   [options.address]                     address to bind udp socket
   * @param  {number}   [options.port]                        port to bind udp socket
   * @param  {string}   [options.broadcast=255.255.255.255] broadcast address
   * @param  {number}   [options.discoveryInterval=10000]     (ms)
   * @param  {number}   [options.discoveryTimeout=0]          (ms)
   * @param  {number}   [options.offlineTolerance=3]          # of consecutive missed replies to consider offline
   * @param  {string[]} [options.deviceTypes]                 'plug','bulb'
   * @param  {string[]} [options.macAddresses]                MAC will be normalized, comparison will be done after removing special characters (`:`,`-`, etc.) and case insensitive
   * @param  {Object}   [options.deviceOptions={}]            passed to device constructors
   * @param  {Object[]} [options.devices]                     known devices to query instead of relying on broadcast
   * @return {Client}                                         this
   * @emits  Client#error
   * @emits  Client#device-new
   * @emits  Client#device-online
   * @emits  Client#device-offline
   * @emits  Client#bulb-new
   * @emits  Client#bulb-online
   * @emits  Client#bulb-offline
   * @emits  Client#plug-new
   * @emits  Client#plug-online
   * @emits  Client#plug-offline
   */
  startDiscovery() {
    var _this6 = this;

    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        address = _ref2.address,
        port = _ref2.port,
        _ref2$broadcast = _ref2.broadcast,
        broadcast = _ref2$broadcast === undefined ? '255.255.255.255' : _ref2$broadcast,
        _ref2$discoveryInterv = _ref2.discoveryInterval,
        discoveryInterval = _ref2$discoveryInterv === undefined ? 10000 : _ref2$discoveryInterv,
        _ref2$discoveryTimeou = _ref2.discoveryTimeout,
        discoveryTimeout = _ref2$discoveryTimeou === undefined ? 0 : _ref2$discoveryTimeou,
        _ref2$offlineToleranc = _ref2.offlineTolerance,
        offlineTolerance = _ref2$offlineToleranc === undefined ? 3 : _ref2$offlineToleranc,
        deviceTypes = _ref2.deviceTypes,
        _ref2$macAddresses = _ref2.macAddresses,
        macAddresses = _ref2$macAddresses === undefined ? [] : _ref2$macAddresses,
        _ref2$deviceOptions = _ref2.deviceOptions,
        deviceOptions = _ref2$deviceOptions === undefined ? {} : _ref2$deviceOptions,
        devices = _ref2.devices;

    this.log.debug('client.startDiscovery(%j)', arguments[0]);

    try {
      macAddresses = macAddresses.map(function (mac) {
        return normalizeMac(mac);
      });

      this.socket = dgram.createSocket('udp4');

      this.socket.on('message', function (msg, rinfo) {
        var decryptedMsg = decrypt(msg).toString('utf8');

        _this6.log.debug(`client.startDiscovery(): socket:message From: ${rinfo.address} ${rinfo.port} Message: ${decryptedMsg}`);

        var jsonMsg = void 0;
        var sysInfo = void 0;
        try {
          jsonMsg = JSON.parse(decryptedMsg);
          sysInfo = jsonMsg.system.get_sysinfo;
        } catch (err) {
          _this6.log.debug(`client.startDiscovery(): Error parsing JSON: %s\nFrom: ${rinfo.address} ${rinfo.port} Original: [%s] Decrypted: [${decryptedMsg}]`, err, msg);
          _this6.emit('discovery-invalid', { rinfo, response: msg, decryptedResponse: decrypt(msg) });
          return;
        }

        if (deviceTypes && deviceTypes.length > 0) {
          var deviceType = _this6.getTypeFromSysInfo(sysInfo);
          if (deviceTypes.indexOf(deviceType) === -1) {
            _this6.log.debug(`client.startDiscovery(): Filtered out: ${sysInfo.alias} (${deviceType}), allowed device types: (%j)`, deviceTypes);
            return;
          }
        }

        if (macAddresses && macAddresses.length > 0) {
          var mac = normalizeMac(sysInfo.mac || sysInfo.mic_mac || sysInfo.ethernet_mac || '');
          if (macAddresses.indexOf(mac) === -1) {
            _this6.log.debug(`client.startDiscovery(): Filtered out: ${sysInfo.alias} (${mac}), allowed macs: (%j)`, macAddresses);
            return;
          }
        }

        _this6.createOrUpdateDeviceFromSysInfo({ sysInfo, host: rinfo.address, port: rinfo.port, options: deviceOptions });
      });

      this.socket.on('error', function (err) {
        _this6.log.error('client.startDiscovery: UDP Error: %s', err);
        _this6.stopDiscovery();
        _this6.emit('error', err);
        // TODO
      });

      this.socket.bind(port, address, function () {
        _this6.isSocketBound = true;
        var address = _this6.socket.address();
        _this6.log.debug(`client.socket: UDP ${address.family} listening on ${address.address}:${address.port}`);
        _this6.socket.setBroadcast(true);

        _this6.discoveryTimer = setInterval(function () {
          _this6.sendDiscovery(broadcast, devices, offlineTolerance);
        }, discoveryInterval);

        _this6.sendDiscovery(broadcast, devices, offlineTolerance);
        if (discoveryTimeout > 0) {
          setTimeout(function () {
            _this6.log.debug('client.startDiscovery: discoveryTimeout reached, stopping discovery');
            _this6.stopDiscovery();
          }, discoveryTimeout);
        }
      });
    } catch (err) {
      this.log.error('client.startDiscovery: %s', err);
      this.emit('error', err);
    }

    return this;
  }
  /**
   * @private
   */
  createOrUpdateDeviceFromSysInfo(_ref3) {
    var sysInfo = _ref3.sysInfo,
        host = _ref3.host,
        port = _ref3.port,
        options = _ref3.options;

    if (this.devices.has(sysInfo.deviceId)) {
      var device = this.devices.get(sysInfo.deviceId);
      device.host = host;
      device.port = port;
      device.sysInfo = sysInfo;
      device.status = 'online';
      device.seenOnDiscovery = this.discoveryPacketSequence;
      this.emit('online', device);
    } else {
      var deviceOptions = (0, _assign2.default)({}, options, { client: this, deviceId: sysInfo.deviceId, host, port });
      var _device = this.getDeviceFromSysInfo(sysInfo, deviceOptions);
      _device.sysInfo = sysInfo;
      _device.status = 'online';
      _device.seenOnDiscovery = this.discoveryPacketSequence;
      this.devices.set(_device.deviceId, _device);
      this.emit('new', _device);
    }
  }
  /**
   * Stops discovery and closes UDP socket.
   */
  stopDiscovery() {
    this.log.debug('client.stopDiscovery()');
    clearInterval(this.discoveryTimer);
    this.discoveryTimer = null;
    if (this.isSocketBound) {
      this.isSocketBound = false;
      this.socket.close();
    }
  }
  /**
   * @private
   */
  sendDiscovery(address, devices, offlineTolerance) {
    var _this7 = this;

    this.log.debug('client.sendDiscovery(%s, %j, %s)', arguments[0], arguments[1], arguments[2]);
    try {
      devices = devices || [];

      this.devices.forEach(function (device) {
        if (device.status !== 'offline') {
          var diff = _this7.discoveryPacketSequence - device.seenOnDiscovery;
          if (diff >= offlineTolerance) {
            device.status = 'offline';
            _this7.emit('offline', device);
          }
        }
      });

      // sometimes there is a race condition with setInterval where this is called after it was cleared
      // check and exit
      if (!this.isSocketBound) {
        return;
      }
      this.socket.send(discoveryMsgBuf, 0, discoveryMsgBuf.length, 9999, address);

      devices.forEach(function (d) {
        _this7.log.debug('client.sendDiscovery() direct device:', d);
        _this7.socket.send(discoveryMsgBuf, 0, discoveryMsgBuf.length, d.port || 9999, d.host);
      });

      if (this.discoveryPacketSequence >= Number.MAX_VALUE) {
        this.discoveryPacketSequence = 0;
      } else {
        this.discoveryPacketSequence += 1;
      }
    } catch (err) {
      this.log.error('client.sendDiscovery: %s', err);
      this.emit('error', err);
    }

    return this;
  }
}

function normalizeMac() {
  var mac = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  return mac.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

module.exports = Client;