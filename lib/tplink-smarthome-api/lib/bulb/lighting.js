/* eslint camelcase: ["off"] */
'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isEqual = require('lodash.isequal');

var _lightState = {};

/**
 * Lighting
 */
class Lighting {
  constructor(device, apiModuleName) {
    this.device = device;
    this.apiModuleName = apiModuleName;

    this._lastState = { powerOn: null, lightState: null };
  }
  /**
   * Returns cached results from last retrieval of `lightingservice.get_light_state`.
   * @return {Object}
   */
  get lightState() {
    return _lightState;
  }
  /**
   * @private
   */
  set lightState(lightState) {
    _lightState = lightState;
    this.emitEvents();
  }
  /**
   * Bulb was turned on (`lightstate.on_off`).
   * @event Bulb#lightstate-on
   * @property {Object} value lightstate
   */
  /**
   * Bulb was turned off (`lightstate.on_off`).
   * @event Bulb#lightstate-off
   * @property {Object} value lightstate
   */
  /**
   * Bulb's lightstate was changed.
   * @event Bulb#lightstate-change
   * @property {Object} value lightstate
   */
  /**
   * Bulb's lightstate state was updated from device. Fired regardless if status was changed.
   * @event Bulb#lightstate-update
   * @property {Object} value lightstate
   */
  /**
   * @private
   */
  emitEvents() {
    if (!_lightState) return;
    var powerOn = _lightState.on_off === 1;

    if (this._lastState.powerOn !== powerOn) {
      this._lastState.powerOn = powerOn;
      if (powerOn) {
        this.device.emit('lightstate-on', _lightState);
      } else {
        this.device.emit('lightstate-off', _lightState);
      }
    }

    if (!isEqual(this._lastState.lightState, _lightState)) {
      this._lastState.lightState = _lightState;
      this.device.emit('lightstate-change', _lightState);
    }
    this.device.emit('lightstate-update', _lightState);
  }
  /**
   * Get Bulb light state.
   *
   * Requests `lightingservice.get_light_state`.
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<Object, ResponseError>} parsed JSON response
   */
  getLightState(sendOptions) {
    var _this = this;

    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return _this.device.sendCommand({
                [_this.apiModuleName]: { get_light_state: {} }
              }, sendOptions);

            case 2:
              _this.lightState = _context.sent;
              return _context.abrupt('return', _this.lightState);

            case 4:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }))();
  }
  /**
   * Sets Bulb light state (on/off, brightness, color, etc).
   *
   * Sends `lightingservice.transition_light_state` command.
   * @param  {Object}       options
   * @param  {number}      [options.transition_period] (ms)
   * @param  {boolean}     [options.on_off]
   * @param  {string}      [options.mode]
   * @param  {number}      [options.hue]               0-360
   * @param  {number}      [options.saturation]        0-100
   * @param  {number}      [options.brightness]        0-100
   * @param  {number}      [options.color_temp]        Kelvin (LB120:2700-6500 LB130:2500-9000)
   * @param  {boolean}     [options.ignore_default=true]
   * @param  {SendOptions} [sendOptions]
   * @return {Promise<boolean, ResponseError>}
   */
  setLightState(_ref, sendOptions) {
    var _this2 = this;

    var transition_period = _ref.transition_period,
        on_off = _ref.on_off,
        mode = _ref.mode,
        hue = _ref.hue,
        saturation = _ref.saturation,
        brightness = _ref.brightness,
        color_temp = _ref.color_temp,
        _ref$ignore_default = _ref.ignore_default,
        ignore_default = _ref$ignore_default === undefined ? true : _ref$ignore_default;
    return (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2() {
      var state;
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              state = {};

              if (ignore_default !== undefined) state.ignore_default = ignore_default ? 1 : 0;
              if (transition_period !== undefined) state.transition_period = transition_period;
              if (on_off !== undefined) state.on_off = on_off ? 1 : 0;
              if (mode !== undefined) state.mode = mode;
              if (hue !== undefined) state.hue = hue;
              if (saturation !== undefined) state.saturation = saturation;
              if (brightness !== undefined) state.brightness = brightness;
              if (color_temp !== undefined) state.color_temp = color_temp;

              _context2.next = 11;
              return _this2.device.sendCommand({
                [_this2.apiModuleName]: { transition_light_state: state }
              }, sendOptions);

            case 11:
              _this2.lightState = _context2.sent;
              return _context2.abrupt('return', true);

            case 13:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this2);
    }))();
  }
}

module.exports = Lighting;