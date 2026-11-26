"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle */
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const device_1 = __importStar(require("../device"));
const cloud_1 = __importStar(require("../shared/cloud"));
const emeter_1 = __importDefault(require("../shared/emeter"));
const time_1 = __importDefault(require("../shared/time"));
const utils_1 = require("../utils");
const lighting_1 = __importStar(require("./lighting"));
const schedule_1 = __importDefault(require("./schedule"));
function isLightStrip(sysinfo) {
    return (sysinfo.length ?? 0) > 0;
}
const TPLINK_KELVIN = [
    [/^KB130/, 2500, 9000],
    [/^KL120\(EU\)/, 2700, 6500],
    [/^KL120\(US\)/, 2700, 5000],
    [/^KL125/, 2500, 6500],
    [/^KL130/, 2500, 9000],
    [/^KL135/, 2500, 9000],
    [/^KL430/, 2500, 9000],
    [/^LB120/, 2700, 6500],
    [/^LB130/, 2500, 9000],
    [/^LB230/, 2500, 9000],
    [/./, 2700, 6500], // default
];
/**
 * Bulb Device.
 *
 * @fires  Bulb#emeter-realtime-update
 * @fires  Bulb#lightstate-on
 * @fires  Bulb#lightstate-off
 * @fires  Bulb#lightstate-change
 * @fires  Bulb#lightstate-update
 * @fires  Bulb#lightstate-sysinfo-on
 * @fires  Bulb#lightstate-sysinfo-off
 * @fires  Bulb#lightstate-sysinfo-change
 * @fires  Bulb#lightstate-sysinfo-update
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class Bulb extends device_1.default {
    emitEventsEnabled = true;
    _sysInfo;
    /**
     * @internal
     */
    lastState = { powerOn: false, sysinfoLightState: {} };
    supportsEmeter = true;
    apiModules = {
        system: 'smartlife.iot.common.system',
        cloud: 'smartlife.iot.common.cloud',
        schedule: 'smartlife.iot.common.schedule',
        timesetting: 'smartlife.iot.common.timesetting',
        emeter: 'smartlife.iot.common.emeter',
        netif: 'netif',
        lightingservice: 'smartlife.iot.smartbulb.lightingservice',
    };
    /**
     * @borrows Cloud#getInfo as Bulb.cloud#getInfo
     * @borrows Cloud#bind as Bulb.cloud#bind
     * @borrows Cloud#unbind as Bulb.cloud#unbind
     * @borrows Cloud#getFirmwareList as Bulb.cloud#getFirmwareList
     * @borrows Cloud#setServerUrl as Bulb.cloud#setServerUrl
     */
    cloud = new cloud_1.default(this, 'smartlife.iot.common.cloud');
    /**
     * @borrows Emeter#realtime as Bulb.emeter#realtime
     * @borrows Emeter#getRealtime as Bulb.emeter#getRealtime
     * @borrows Emeter#getDayStats as Bulb.emeter#getDayStats
     * @borrows Emeter#getMonthStats as Bulb.emeter#getMonthStats
     * @borrows Emeter#eraseStats as Bulb.emeter#eraseStats
     */
    emeter = new emeter_1.default(this, 'smartlife.iot.common.emeter');
    /**
     * @borrows Lighting#lightState as Bulb.lighting#lightState
     * @borrows Lighting#getLightState as Bulb.lighting#getLightState
     * @borrows Lighting#setLightState as Bulb.lighting#setLightState
     */
    lighting;
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
    schedule = new schedule_1.default(this, 'smartlife.iot.common.schedule');
    /**
     * @borrows Time#getTime as Bulb.time#getTime
     * @borrows Time#getTimezone as Bulb.time#getTimezone
     */
    time = new time_1.default(this, 'smartlife.iot.common.timesetting');
    /**
     * Created by {@link Client} - Do not instantiate directly.
     *
     * See [Device constructor]{@link Device} for common options.
     * @see Device
     * @param options -
     */
    constructor(options) {
        super({
            client: options.client,
            _sysInfo: options.sysInfo,
            host: options.host,
            port: options.port,
            logger: options.logger,
            defaultSendOptions: options.defaultSendOptions,
        });
        this.lastState = Object.assign(this.lastState, {
            powerOn: null,
            inUse: null,
        });
        this.apiModules = {
            system: 'smartlife.iot.common.system',
            cloud: 'smartlife.iot.common.cloud',
            schedule: 'smartlife.iot.common.schedule',
            timesetting: 'smartlife.iot.common.timesetting',
            emeter: 'smartlife.iot.common.emeter',
            netif: 'netif',
            lightingservice: isLightStrip(options.sysInfo)
                ? 'smartlife.iot.lightStrip'
                : 'smartlife.iot.smartbulb.lightingservice',
        };
        this.lighting = new lighting_1.default(this, this.apiModules.lightingservice, isLightStrip(options.sysInfo)
            ? 'set_light_state'
            : 'transition_light_state');
        this.setSysInfo(options.sysInfo);
        this._sysInfo = options.sysInfo;
    }
    /**
     * Returns cached results from last retrieval of `system.sysinfo`.
     * @returns system.sysinfo
     */
    get sysInfo() {
        return this._sysInfo;
    }
    /**
     * @internal
     */
    setSysInfo(sysInfo) {
        super.setSysInfo(sysInfo);
        this.emitEvents();
    }
    setAliasProperty(alias) {
        this.sysInfo.alias = alias;
    }
    /**
     * Cached value of `sysinfo.[description|dev_name]`.
     */
    get description() {
        return this.sysInfo.description;
    }
    // eslint-disable-next-line class-methods-use-this
    get deviceType() {
        return 'bulb';
    }
    /**
     * Cached value of `sysinfo.is_dimmable === 1`
     * @returns Cached value of `sysinfo.is_dimmable === 1`
     */
    get supportsBrightness() {
        return this.sysInfo.is_dimmable === 1;
    }
    /**
     * Cached value of `sysinfo.is_color === 1`
     * @returns Cached value of `sysinfo.is_color === 1`
     */
    get supportsColor() {
        return this.sysInfo.is_color === 1;
    }
    /**
     * Cached value of `sysinfo.is_variable_color_temp === 1`
     * @returns Cached value of `sysinfo.is_variable_color_temp === 1`
     */
    get supportsColorTemperature() {
        return this.sysInfo.is_variable_color_temp === 1;
    }
    /**
     * Returns array with min and max supported color temperatures
     * @returns range in kelvin `{min,max}` or `null` if not supported
     */
    get colorTemperatureRange() {
        if (!this.supportsColorTemperature)
            return null;
        const { model } = this.sysInfo;
        const k = TPLINK_KELVIN.find(([re]) => re.test(model));
        if (k != null)
            return { min: k[1], max: k[2] };
        return null;
    }
    /**
     * Gets bulb's SysInfo.
     *
     * Requests `system.sysinfo` from device.
     * @returns parsed JSON response
     */
    async getSysInfo(sendOptions) {
        const response = await super.getSysInfo(sendOptions);
        if (!(0, device_1.isBulbSysinfo)(response)) {
            throw new Error(`Unexpected Response: ${JSON.stringify(response)}`);
        }
        return this.sysInfo;
    }
    /**
     * Requests common Bulb status details in a single request.
     * - `system.get_sysinfo`
     * - `cloud.get_sysinfo`
     * - `emeter.get_realtime`
     * - `schedule.get_next_action`
     *
     * This command is likely to fail on some devices when using UDP transport.
     * This defaults to TCP transport unless overridden in sendOptions.
     *
     * @returns parsed JSON response
     */
    async getInfo(sendOptions) {
        // force TCP unless overridden here
        const sendOptionsForGetInfo = sendOptions == null ? {} : sendOptions;
        if (!('transport' in sendOptionsForGetInfo))
            sendOptionsForGetInfo.transport = 'tcp';
        // TODO switch to sendCommand, but need to handle error for devices that don't support emeter
        const response = await this.send(`{"${this.apiModules.emeter}":{"get_realtime":{}},"${this.apiModules.lightingservice}":{"get_light_state":{}},"${this.apiModules.schedule}":{"get_next_action":{}},"system":{"get_sysinfo":{}},"${this.apiModules.cloud}":{"get_info":{}}}`, sendOptionsForGetInfo);
        const data = JSON.parse(response);
        const sysinfo = (0, utils_1.extractResponse)(data, 'system.get_sysinfo', device_1.isBulbSysinfo);
        this.setSysInfo(sysinfo);
        const cloudInfo = (0, utils_1.extractResponse)(data, [this.apiModules.cloud, 'get_info'], (c) => (0, cloud_1.isCloudInfo)(c) && (0, utils_1.hasErrCode)(c));
        this.cloud.info = cloudInfo;
        const emeterKey = this.apiModules.emeter;
        if ((0, utils_1.isObjectLike)(data) &&
            (0, utils_1.objectHasKey)(data, emeterKey) &&
            (0, utils_1.isObjectLike)(data[emeterKey]) &&
            (0, utils_1.objectHasKey)(data[emeterKey], 'get_realtime') &&
            // @ts-expect-error: limitation of TS type checking
            (0, utils_1.isObjectLike)(data[emeterKey].get_realtime)) {
            // @ts-expect-error: limitation of TS type checking
            const realtime = data[emeterKey].get_realtime;
            this.emeter.setRealtime(realtime);
        }
        const scheduleNextAction = (0, utils_1.extractResponse)(data, [this.apiModules.schedule, 'get_next_action'], utils_1.hasErrCode);
        this.schedule.nextAction = scheduleNextAction;
        const lightState = (0, utils_1.extractResponse)(data, [this.apiModules.lightingservice, 'get_light_state'], lighting_1.isLightState);
        this.lighting.lightState = lightState;
        return {
            sysInfo: this.sysInfo,
            cloud: { info: this.cloud.info },
            emeter: { realtime: this.emeter.realtime },
            schedule: { nextAction: this.schedule.nextAction },
            lighting: { lightState: this.lighting.lightState },
        };
    }
    /**
     * Gets on/off state of Bulb.
     *
     * Requests `lightingservice.get_light_state` and returns true if `on_off === 1`.
     * @throws {@link ResponseError}
     */
    async getPowerState(sendOptions) {
        const lightState = await this.lighting.getLightState(sendOptions);
        return lightState.on_off === 1;
    }
    /**
     * Sets on/off state of Bulb.
     *
     * Sends `lightingservice.transition_light_state` command with on_off `value`.
     * @param  value - true: on, false: off
     * @throws {@link ResponseError}
     */
    async setPowerState(value, sendOptions) {
        return this.lighting.setLightState({ on_off: value ? 1 : 0 }, sendOptions);
    }
    /**
     * Toggles state of Bulb.
     *
     * Requests `lightingservice.get_light_state` sets the power state to the opposite of `on_off === 1` and returns the new power state.
     * @throws {@link ResponseError}
     */
    async togglePowerState(sendOptions) {
        const powerState = await this.getPowerState(sendOptions);
        await this.setPowerState(!powerState, sendOptions);
        return !powerState;
    }
    /**
     * Blink Bulb.
     *
     * Sends `system.lighting.set_light_state` command alternating on at full brightness and off number of `times` at `rate`,
     * then sets the light state to its pre-blink state.
     * @throws {@link ResponseError}
     */
    async blink(times = 5, rate = 1000, sendOptions) {
        const delay = (t) => {
            return new Promise((resolve) => {
                setTimeout(resolve, t);
            });
        };
        const origLightState = await this.lighting.getLightState(sendOptions);
        let lastBlink;
        let isBlinkOn = false;
        for (let i = 0; i < times * 2; i += 1) {
            isBlinkOn = !isBlinkOn;
            lastBlink = Date.now();
            const lightState = isBlinkOn
                ? { on_off: 1, brightness: 100 }
                : { on_off: 0 };
            // eslint-disable-next-line no-await-in-loop
            await this.lighting.setLightState(lightState, sendOptions);
            const timeToWait = rate / 2 - (Date.now() - lastBlink);
            if (timeToWait > 0) {
                // eslint-disable-next-line no-await-in-loop
                await delay(timeToWait);
            }
        }
        const currLightState = await this.lighting.getLightState(sendOptions);
        if (currLightState !== origLightState) {
            await this.lighting.setLightState(origLightState, sendOptions);
        }
        return true;
    }
    emitEvents() {
        if (!this.emitEventsEnabled) {
            return;
        }
        const { light_state: sysinfoLightState } = this._sysInfo;
        const powerOn = sysinfoLightState.on_off === 1;
        if (this.lastState.powerOn !== powerOn) {
            if (powerOn) {
                this.emit('lightstate-sysinfo-on', sysinfoLightState);
            }
            else {
                this.emit('lightstate-sysinfo-off', sysinfoLightState);
            }
        }
        if (!(0, lodash_isequal_1.default)(this.lastState.sysinfoLightState, sysinfoLightState)) {
            this.emit('lightstate-sysinfo-change', sysinfoLightState);
        }
        this.emit('lightstate-sysinfo-update', sysinfoLightState);
        this.lastState.powerOn = powerOn;
        this.lastState.sysinfoLightState = sysinfoLightState;
    }
}
exports.default = Bulb;
//# sourceMappingURL=index.js.map