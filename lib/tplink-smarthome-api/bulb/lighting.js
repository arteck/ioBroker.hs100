"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLightStateResponse = exports.isLightState = void 0;
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const utils_1 = require("../utils");
function isLightState(candidate) {
    return (0, utils_1.isObjectLike)(candidate);
}
exports.isLightState = isLightState;
function isLightStateResponse(candidate) {
    return (0, utils_1.isObjectLike)(candidate) && (0, utils_1.hasErrCode)(candidate);
}
exports.isLightStateResponse = isLightStateResponse;
class Lighting {
    device;
    apiModuleName;
    setLightStateMethodName;
    /**
     * @internal
     */
    lastState = {
        powerOn: undefined,
        lightState: undefined,
    };
    /**
     * @internal
     */
    #lightState = {};
    constructor(device, apiModuleName, setLightStateMethodName) {
        this.device = device;
        this.apiModuleName = apiModuleName;
        this.setLightStateMethodName = setLightStateMethodName;
    }
    /**
     * Returns cached results from last retrieval of `lightingservice.get_light_state`.
     * @returns cached results from last retrieval of `lightingservice.get_light_state`.
     */
    get lightState() {
        return this.#lightState;
    }
    /**
     * @internal
     */
    set lightState(lightState) {
        this.#lightState = lightState;
        this.emitEvents();
    }
    emitEvents() {
        const powerOn = this.#lightState.on_off === 1;
        if (this.lastState.powerOn !== powerOn) {
            if (powerOn) {
                this.device.emit('lightstate-on', this.#lightState);
            }
            else {
                this.device.emit('lightstate-off', this.#lightState);
            }
        }
        if (!(0, lodash_isequal_1.default)(this.lastState.lightState, this.#lightState)) {
            this.device.emit('lightstate-change', this.#lightState);
        }
        this.device.emit('lightstate-update', this.#lightState);
        this.lastState.powerOn = powerOn;
        this.lastState.lightState = this.#lightState;
    }
    /**
     * Get Bulb light state.
     *
     * Requests `lightingservice.get_light_state`.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getLightState(sendOptions) {
        this.lightState = (0, utils_1.extractResponse)(await this.device.sendCommand({
            [this.apiModuleName]: { get_light_state: {} },
        }, undefined, sendOptions), '', isLightStateResponse);
        return this.lightState;
    }
    /**
     * Sets Bulb light state (on/off, brightness, color, etc).
     *
     * Sends `lightingservice.transition_light_state` command.
     * @param  lightState - light state
     * @param  sendOptions - send options
     */
    async setLightState(lightState, sendOptions) {
        const { 
        /* eslint-disable @typescript-eslint/naming-convention */
        transition_period, on_off, mode, hue, saturation, brightness, color_temp, ignore_default = 1,
        /* eslint-enable @typescript-eslint/naming-convention */
         } = lightState;
        const state = {};
        if ((0, utils_1.isDefinedAndNotNull)(ignore_default))
            state.ignore_default = ignore_default ? 1 : 0;
        if ((0, utils_1.isDefinedAndNotNull)(transition_period))
            state.transition_period = transition_period;
        if ((0, utils_1.isDefinedAndNotNull)(on_off))
            state.on_off = on_off ? 1 : 0;
        if ((0, utils_1.isDefinedAndNotNull)(mode))
            state.mode = mode;
        if ((0, utils_1.isDefinedAndNotNull)(hue))
            state.hue = hue;
        if ((0, utils_1.isDefinedAndNotNull)(saturation))
            state.saturation = saturation;
        if ((0, utils_1.isDefinedAndNotNull)(brightness))
            state.brightness = brightness;
        if ((0, utils_1.isDefinedAndNotNull)(color_temp))
            state.color_temp = color_temp;
        const response = (0, utils_1.extractResponse)(await this.device.sendCommand({
            [this.apiModuleName]: { [this.setLightStateMethodName]: state },
        }, undefined, sendOptions), '', isLightStateResponse);
        // The light strip in particular returns more detail with get(), so only
        // apply the subset that is returned with set()
        this.lightState = { ...this.lightState, ...response };
        return true;
    }
    /**
     * Get Bulb light details.
     *
     * Requests `lightingservice.get_light_details`.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getLightDetails(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { get_light_details: {} },
        }, undefined, sendOptions);
    }
}
exports.default = Lighting;
//# sourceMappingURL=lighting.js.map