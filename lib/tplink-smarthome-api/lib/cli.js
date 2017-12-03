#! /usr/bin/env node

'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var util = require('util');
var program = require('commander');
var tplinkCrypto = require('tplink-smarthome-crypto');

var _require = require('./'),
    Client = _require.Client,
    ResponseError = _require.ResponseError;

var logLevel = void 0;
var client = void 0;

var outputError = function outputError(err) {
  if (err instanceof ResponseError) {
    console.log(err.response);
  } else {
    console.error(err);
  }
};

var search = function search(sysInfo, timeout, params) {
  try {
    console.log('Searching...');

    var commandParams = (0, _assign2.default)({}, { discoveryInterval: 2000, discoveryTimeout: timeout }, params); // {discoveryInterval: 2000, discoveryTimeout: timeout, ...params};
    console.log(`startDiscovery(${util.inspect(commandParams)})`);
    client.startDiscovery(commandParams).on('device-new', function (device) {
      console.log(`${device.model} ${device.deviceType} ${device.type} ${device.host} ${device.port} ${device.deviceId} ${device.alias}`);
      if (sysInfo) {
        console.dir(device.sysInfo, { colors: program.color === 'on', depth: 10 });
      }
    });
  } catch (err) {
    outputError(err);
  }
};

var send = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(host, port, payload) {
    var data;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            console.log(`Sending to ${host}:${port}...`);
            _context.next = 4;
            return client.send(payload, host, port);

          case 4:
            data = _context.sent;

            console.log('response:');
            console.dir(data, { colors: program.color === 'on', depth: 10 });
            _context.next = 12;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](0);

            outputError(_context.t0);

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 9]]);
  }));

  return function send(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var sendCommand = function () {
  var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(host, port, payload) {
    var device, results;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            console.log(`Sending to ${host}:${port}...`);
            _context2.next = 4;
            return client.getDevice({ host, port });

          case 4:
            device = _context2.sent;
            _context2.next = 7;
            return device.sendCommand(payload);

          case 7:
            results = _context2.sent;

            console.log('response:');
            console.dir(results, { colors: program.color === 'on', depth: 10 });
            _context2.next = 15;
            break;

          case 12:
            _context2.prev = 12;
            _context2.t0 = _context2['catch'](0);

            outputError(_context2.t0);

          case 15:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[0, 12]]);
  }));

  return function sendCommand(_x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}();

var sendCommandDynamic = function () {
  var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(host, port, command) {
    var commandParams = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];
    var device, results;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            console.log(`Sending ${command} command to ${host}:${port}...`);
            _context3.next = 4;
            return client.getDevice({ host, port });

          case 4:
            device = _context3.sent;
            _context3.next = 7;
            return device[command].apply(device, (0, _toConsumableArray3.default)(commandParams));

          case 7:
            results = _context3.sent;

            console.log('response:');
            console.dir(results, { colors: program.color === 'on', depth: 10 });
            _context3.next = 15;
            break;

          case 12:
            _context3.prev = 12;
            _context3.t0 = _context3['catch'](0);

            outputError(_context3.t0);

          case 15:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[0, 12]]);
  }));

  return function sendCommandDynamic(_x7, _x8, _x9) {
    return _ref3.apply(this, arguments);
  };
}();

var details = function () {
  var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(host, port, timeout) {
    var device;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            console.log(`Getting details from ${host}:${port}...`);
            _context4.next = 4;
            return client.getDevice({ host, port });

          case 4:
            device = _context4.sent;

            console.dir({
              alias: device.alias,
              deviceId: device.deviceId,
              description: device.description,
              model: device.model,
              deviceType: device.deviceType,
              type: device.type,
              softwareVersion: device.softwareVersion,
              hardwareVersion: device.hardwareVersion,
              mac: device.mac
            }, { colors: program.color === 'on', depth: 10 });
            _context4.next = 11;
            break;

          case 8:
            _context4.prev = 8;
            _context4.t0 = _context4['catch'](0);

            outputError(_context4.t0);

          case 11:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this, [[0, 8]]);
  }));

  return function details(_x11, _x12, _x13) {
    return _ref4.apply(this, arguments);
  };
}();

var blink = function blink(host, port, times, rate, timeout) {
  console.log(`Sending blink commands to ${host}:${port}...`);
  client.getDevice({ host, port }).then(function (device) {
    return device.blink(times, rate).then(function () {
      console.log('Blinking complete');
    });
  }).catch(function (reason) {
    outputError(reason);
  });
};

var toInt = function toInt(s) {
  return parseInt(s);
};

var setupClient = function setupClient() {
  var defaultSendOptions = {};
  if (program.udp) defaultSendOptions.transport = 'udp';
  if (program.timeout) defaultSendOptions.timeout = program.timeout;
  var client = new Client({ logLevel, defaultSendOptions });
  return client;
};

program.option('-D, --debug', 'turn on debug level logging', function () {
  logLevel = 'debug';
}).option('-t, --timeout <ms>', 'timeout (ms)', toInt, 5000).option('-u, --udp', 'send via UDP').option('-c, --color [on]', 'output will be styled with ANSI color codes', 'on');

program.command('search [params]').description('Search for devices').option('-s, --sysinfo', 'output sysInfo').action(function (params, options) {
  client = setupClient();
  if (params) {
    console.dir(params);
    params = JSON.parse(params);
  }
  search(options.sysinfo, program.timeout, params);
});

program.command('send <host> <payload>').description('Send payload to device (using Client.send)').action(function (host, payload, options) {
  client = setupClient();

  var _host$split = host.split(':'),
      _host$split2 = (0, _slicedToArray3.default)(_host$split, 2),
      hostOnly = _host$split2[0],
      port = _host$split2[1];

  send(hostOnly, port, payload);
});

program.command('sendCommand <host> <payload>').description('Send payload to device (using Device#sendCommand)').action(function (host, payload, options) {
  client = setupClient();

  var _host$split3 = host.split(':'),
      _host$split4 = (0, _slicedToArray3.default)(_host$split3, 2),
      hostOnly = _host$split4[0],
      port = _host$split4[1];

  sendCommand(hostOnly, port, payload);
});

program.command('details <host>').action(function (host, options) {
  client = setupClient();

  var _host$split5 = host.split(':'),
      _host$split6 = (0, _slicedToArray3.default)(_host$split5, 2),
      hostOnly = _host$split6[0],
      port = _host$split6[1];

  details(hostOnly, port, program.timeout);
});

program.command('blink <host> [times] [rate]').action(function (host) {
  var times = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5;
  var rate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 500;
  var options = arguments[3];

  client = setupClient();

  var _host$split7 = host.split(':'),
      _host$split8 = (0, _slicedToArray3.default)(_host$split7, 2),
      hostOnly = _host$split8[0],
      port = _host$split8[1];

  blink(hostOnly, port, times, rate);
});

['getSysInfo', 'getInfo', 'setAlias', 'setLocation', 'getModel', 'reboot', 'reset'].forEach(function (command) {
  program.command(`${command} <host> [params]`).description(`Send ${command} to device (using Device#${command})`).option('-t, --timeout [timeout]', 'timeout (ms)', toInt, 5000).action(function (host, params, options) {
    client = setupClient();

    var _host$split9 = host.split(':'),
        _host$split10 = (0, _slicedToArray3.default)(_host$split9, 2),
        hostOnly = _host$split10[0],
        port = _host$split10[1];

    sendCommandDynamic(hostOnly, port, command, params);
  });
});

program.command('encrypt <outputEncoding> <input> [firstKey=0xAB]').action(function (outputEncoding, input) {
  var firstKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0xAB;

  var outputBuf = tplinkCrypto.encrypt(input, firstKey);
  console.log(outputBuf.toString(outputEncoding));
});
program.command('encryptWithHeader <outputEncoding> <input> [firstKey=0xAB]').action(function (outputEncoding, input) {
  var firstKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0xAB;

  var outputBuf = tplinkCrypto.encryptWithHeader(input, firstKey);
  console.log(outputBuf.toString(outputEncoding));
});
program.command('decrypt <inputEncoding> <input> [firstKey=0xAB]').action(function (inputEncoding, input) {
  var firstKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0xAB;

  var inputBuf = Buffer.from(input, inputEncoding);
  var outputBuf = tplinkCrypto.decrypt(inputBuf, firstKey);
  console.log(outputBuf.toString());
});
program.command('decryptWithHeader <inputEncoding> <input> [firstKey=0xAB]').action(function (inputEncoding, input) {
  var firstKey = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0xAB;

  var inputBuf = Buffer.from(input, inputEncoding);
  var outputBuf = tplinkCrypto.decryptWithHeader(inputBuf, firstKey);
  console.log(outputBuf.toString());
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}