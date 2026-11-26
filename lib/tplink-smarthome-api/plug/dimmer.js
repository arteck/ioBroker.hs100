"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Dimmer
 *
 * TP-Link models: HS220.
 */
class Dimmer {
    device;
    apiModuleName;
    /**
     * @internal
     */
    lastState = { brightness: -1 };
    /**
     * @internal
     */
    #brightness = 0;
    constructor(device, apiModuleName) {
        this.device = device;
        this.apiModuleName = apiModuleName;
    }
    /**
     * Cached value of `sysinfo.brightness`.
     */
    get brightness() {
        return this.#brightness;
    }
    /**
     * @internal
     */
    setBrightnessValue(brightness) {
        this.#brightness = brightness;
        this.device.log.debug('[%s] plug.dimmer brightness set', this.device.alias);
        this.emitEvents();
    }
    /**
     * Sets Plug to the specified `brightness`.
     *
     * Sends `dimmer.set_brightness` command. Does not support childId.
     * @param   brightness - 0-100
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setBrightness(brightness, sendOptions) {
        const results = this.device.sendCommand({
            [this.apiModuleName]: {
                set_brightness: { brightness },
            },
        }, undefined, sendOptions);
        this.setBrightnessValue(brightness);
        return results;
    }
    /**
     * Get Plug/Dimmer default behavior configuration.
     *
     * Requests `dimmer.get_default_behavior`. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getDefaultBehavior(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: {
                get_default_behavior: {},
            },
        }, undefined, sendOptions);
    }
    /**
     * Get Plug/Dimmer parameters configuration.
     *
     * Requests `dimmer.get_dimmer_parameters`. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getDimmerParameters(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: {
                get_dimmer_parameters: {},
            },
        }, undefined, sendOptions);
    }
    /**
     * Transitions Plug to the specified `brightness`.
     *
     * Sends `dimmer.set_dimmer_transition` command. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setDimmerTransition(dimmerTransition, sendOptions) {
        const { brightness, mode, duration } = dimmerTransition;
        const results = this.device.sendCommand({
            [this.apiModuleName]: {
                set_dimmer_transition: {
                    brightness,
                    mode,
                    duration,
                },
            },
        }, undefined, sendOptions);
        if (brightness !== undefined)
            this.setBrightnessValue(brightness);
        return results;
    }
    /**
     * Set Plug/Dimmer `default_behavior` configuration for `double_click`.
     *
     * Sends `dimmer.set_double_click_action`. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setDoubleClickAction({ mode, index }, sendOptions) {
        return this.setAction({
            actionName: 'set_double_click_action',
            mode,
            index,
        }, sendOptions);
    }
    async setAction({ actionName, mode, index, }, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: {
                [actionName]: { mode, index },
            },
        }, undefined, sendOptions);
    }
    /**
     * Set Plug `dimmer_parameters` for `fadeOffTime`.
     *
     * Sends `dimmer.set_fade_off_time`. Does not support childId.
     * @param   fadeTime - duration in ms
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setFadeOffTime(fadeTime, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: {
                set_fade_off_time: { fadeTime },
            },
        }, undefined, sendOptions);
    }
    /**
     * Set Plug `dimmer_parameters` for `fadeOnTime`.
     *
     * Sends `dimmer.set_fade_on_time`. Does not support childId.
     * @param   fadeTime - duration in ms
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setFadeOnTime(fadeTime, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: {
                set_fade_on_time: { fadeTime },
            },
        }, undefined, sendOptions);
    }
    /**
     * Set Plug `dimmer_parameters` for `gentleOffTime`.
     *
     * Sends `dimmer.set_gentle_off_time`. Does not support childId.
     * @param   duration - duration in ms
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setGentleOffTime(duration, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: {
                set_gentle_off_time: { duration },
            },
        }, undefined, sendOptions);
    }
    /**
     * Set Plug `dimmer_parameters` for `gentleOnTime`.
     *
     * Sends `dimmer.set_gentle_on_time`. Does not support childId.
     * @param   duration - duration in ms
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setGentleOnTime(duration, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: {
                set_gentle_on_time: { duration },
            },
        }, undefined, sendOptions);
    }
    /**
     * Set Plug/Dimmer `default_behavior` configuration for `long_press`.
     *
     * Sends `dimmer.set_long_press_action`. Does not support childId.
     * @param   options
     * @param   options.mode
     * @param   options.index
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setLongPressAction({ mode, index }, sendOptions) {
        return this.setAction({ actionName: 'set_long_press_action', mode, index }, sendOptions);
    }
    /**
     * Sets Plug to the specified on/off state.
     *
     * Sends `dimmer.set_switch_state` command. Does not support childId.
     * @param  {Boolean}     state  true=on, false=off
     * @param  {SendOptions} [sendOptions]
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setSwitchState(state, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: {
                set_switch_state: { state: state ? 1 : 0 },
            },
        }, undefined, sendOptions);
    }
    /**
     * @internal
     */
    emitEvents() {
        const brightness = this.#brightness;
        this.device.log.debug('[%s] plug.dimmer.emitEvents() brightness: %s lastState: %j', this.device.alias, brightness, this.lastState);
        if (this.lastState.brightness !== brightness) {
            this.lastState.brightness = brightness;
            this.device.emit('brightness-change', brightness);
        }
        this.device.emit('brightness-update', brightness);
    }
}
exports.default = Dimmer;
//# sourceMappingURL=dimmer.js.map