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
exports.hasSysinfoChildren = void 0;
const device_1 = __importStar(require("../device"));
const cloud_1 = __importStar(require("../shared/cloud"));
const emeter_1 = __importDefault(require("../shared/emeter"));
const time_1 = __importDefault(require("../shared/time"));
const utils_1 = require("../utils");
const away_1 = __importDefault(require("./away"));
const dimmer_1 = __importDefault(require("./dimmer"));
const schedule_1 = __importDefault(require("./schedule"));
const timer_1 = __importDefault(require("./timer"));
function hasSysinfoChildren(candidate) {
    return ('children' in candidate &&
        candidate.children !== undefined &&
        // eslint rule false positive
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        candidate.children.length > 0);
}
exports.hasSysinfoChildren = hasSysinfoChildren;
/**
 * Plug Device.
 *
 * TP-Link models: HS100, HS105, HS107, HS110, HS200, HS210, HS220, HS300.
 *
 * Models with multiple outlets (HS107, HS300) will have a children property.
 * If Plug is instantiated with a childId it will control the outlet associated with that childId.
 * Some functions only apply to the entire device, and are noted below.
 *
 * Emits events after device status is queried, such as {@link Plug#getSysInfo} and {@link Plug#emeter.getRealtime}.
 * @extends Device
 * @extends EventEmitter
 * @fires  Plug#power-on
 * @fires  Plug#power-off
 * @fires  Plug#power-update
 * @fires  Plug#in-use
 * @fires  Plug#not-in-use
 * @fires  Plug#in-use-update
 * @fires  Plug#emeter-realtime-update
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class Plug extends device_1.default {
    _sysInfo;
    #children = new Map();
    #child;
    #childId;
    inUseThreshold = 0.1;
    emitEventsEnabled = true;
    /**
     * @internal
     */
    lastState = { inUse: false, relayState: false };
    apiModules = {
        system: 'system',
        cloud: 'cnCloud',
        schedule: 'schedule',
        timesetting: 'time',
        emeter: 'emeter',
        netif: 'netif',
        lightingservice: '',
    };
    away;
    cloud;
    dimmer;
    emeter;
    schedule;
    time;
    timer;
    /**
     * Created by {@link Client} - Do not instantiate directly.
     *
     * See [Device constructor]{@link Device} for common options.
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
        const { sysInfo, inUseThreshold = 0.1, childId } = options;
        this.log.debug('plug.constructor()');
        /**
         * @borrows Away#getRules as Plug.away#getRules
         * @borrows Away#addRule as Plug.away#addRule
         * @borrows Away#editRule as Plug.away#editRule
         * @borrows Away#deleteAllRules as Plug.away#deleteAllRules
         * @borrows Away#deleteRule as Plug.away#deleteRule
         * @borrows Away#setOverallEnable as Plug.away#setOverallEnable
         */
        this.away = new away_1.default(this, 'anti_theft', this.#childId);
        /**
         * @borrows Cloud#getInfo as Plug.cloud#getInfo
         * @borrows Cloud#bind as Plug.cloud#bind
         * @borrows Cloud#unbind as Plug.cloud#unbind
         * @borrows Cloud#getFirmwareList as Plug.cloud#getFirmwareList
         * @borrows Cloud#setServerUrl as Plug.cloud#setServerUrl
         */
        this.cloud = new cloud_1.default(this, 'cnCloud');
        /**
         * @borrows Dimmer#setBrightness as Plug.dimmer#setBrightness
         * @borrows Dimmer#getDefaultBehavior as Plug.dimmer#getDefaultBehavior
         * @borrows Dimmer#getDimmerParameters as Plug.dimmer#getDimmerParameters
         * @borrows Dimmer#setDimmerTransition as Plug.dimmer#setDimmerTransition
         * @borrows Dimmer#setDoubleClickAction as Plug.dimmer#setDoubleClickAction
         * @borrows Dimmer#setFadeOffTime as Plug.dimmer#setFadeOffTime
         * @borrows Dimmer#setFadeOnTime as Plug.dimmer#setFadeOnTime
         * @borrows Dimmer#setGentleOffTime as Plug.dimmer#setGentleOffTime
         * @borrows Dimmer#setGentleOnTime as Plug.dimmer#setGentleOnTime
         * @borrows Dimmer#setLongPressAction as Plug.dimmer#setLongPressAction
         * @borrows Dimmer#setSwitchState as Plug.dimmer#setSwitchState
         */
        this.dimmer = new dimmer_1.default(this, 'smartlife.iot.dimmer');
        /**
         * @borrows Emeter#realtime as Plug.emeter#realtime
         * @borrows Emeter#getRealtime as Plug.emeter#getRealtime
         * @borrows Emeter#getDayStats as Plug.emeter#getDayStats
         * @borrows Emeter#getMonthStats as Plug.emeter#getMonthStats
         * @borrows Emeter#eraseStats as Plug.emeter#eraseStats
         */
        this.emeter = new emeter_1.default(this, 'emeter', this.#childId);
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
        this.schedule = new schedule_1.default(this, 'schedule', this.#childId);
        /**
         * @borrows Time#getTime as Plug.time#getTime
         * @borrows Time#getTimezone as Plug.time#getTimezone
         */
        this.time = new time_1.default(this, 'time');
        /**
         * @borrows Timer#getRules as Plug.timer#getRules
         * @borrows Timer#addRule as Plug.timer#addRule
         * @borrows Timer#editRule as Plug.timer#editRule
         * @borrows Timer#deleteAllRules as Plug.timer#deleteAllRules
         */
        this.timer = new timer_1.default(this, 'count_down', this.#childId);
        this._sysInfo = sysInfo;
        this.setSysInfo(sysInfo);
        this.inUseThreshold = inUseThreshold;
        if ((0, utils_1.isDefinedAndNotNull)(childId))
            this.setChildId(childId);
        this.lastState.inUse = this.inUse;
        this.lastState.relayState = this.relayState;
    }
    get sysInfo() {
        return this._sysInfo;
    }
    /**
     * @internal
     */
    setSysInfo(sysInfo) {
        super.setSysInfo(sysInfo);
        if (sysInfo.children) {
            this.setChildren(sysInfo.children);
        }
        if (sysInfo.brightness !== undefined) {
            this.dimmer.setBrightnessValue(sysInfo.brightness);
        }
        this.log.debug('[%s] plug sysInfo set', this.alias);
        this.emitEvents();
    }
    /**
     * Returns children as a map keyed by childId. From cached results from last retrieval of `system.sysinfo.children`.
     */
    get children() {
        return this.#children;
    }
    setChildren(children) {
        if (Array.isArray(children)) {
            this.#children = new Map(children.map((child) => {
                // eslint-disable-next-line no-param-reassign
                child.id = this.normalizeChildId(child.id);
                return [child.id, child];
            }));
        }
        else if (children instanceof Map) {
            this.#children = children;
        }
        if (this.#childId !== undefined)
            this.setChildId(this.#childId);
    }
    /**
     * Returns childId.
     */
    get childId() {
        return this.#childId;
    }
    setChildId(childId) {
        this.#childId = this.normalizeChildId(childId);
        if (this.#childId) {
            this.#child = this.#children.get(this.#childId);
        }
        if (this.#childId && this.#child == null) {
            throw new Error(`Could not find child with childId ${childId}`);
        }
    }
    /**
     * Cached value of `sysinfo.alias` or `sysinfo.children[childId].alias` if childId set.
     */
    get alias() {
        if (this.#childId && this.#child !== undefined) {
            return this.#child.alias;
        }
        return this.sysInfo.alias;
    }
    setAliasProperty(alias) {
        if (this.#childId && this.#child !== undefined) {
            this.#child.alias = alias;
        }
        this.sysInfo.alias = alias;
    }
    /**
     * Cached value of `sysinfo.dev_name`.
     */
    get description() {
        return this.sysInfo.dev_name;
    }
    // eslint-disable-next-line class-methods-use-this
    get deviceType() {
        return 'plug';
    }
    /**
     * Cached value of `sysinfo.deviceId` or `childId` if set.
     */
    get id() {
        if (this.#childId && this.#child !== undefined) {
            return this.#childId;
        }
        return this.sysInfo.deviceId;
    }
    /**
     * Determines if device is in use based on cached `emeter.get_realtime` results.
     *
     * If device supports energy monitoring (e.g. HS110): `power > inUseThreshold`. `inUseThreshold` is specified in Watts
     *
     * Otherwise fallback on relay state: `relay_state === 1` or `sysinfo.children[childId].state === 1`.
     *
     * Supports childId.
     */
    get inUse() {
        if (this.supportsEmeter &&
            'power' in this.emeter.realtime &&
            this.emeter.realtime.power !== undefined) {
            return this.emeter.realtime.power > this.inUseThreshold;
        }
        return this.relayState;
    }
    /**
     * Cached value of `sysinfo.relay_state === 1` or `sysinfo.children[childId].state === 1`.
     * Supports childId.
     * If device supports childId, but childId is not set, then it will return true if any child has `state === 1`.
     * @returns On (true) or Off (false)
     */
    get relayState() {
        if (this.#childId && this.#child !== undefined) {
            return this.#child.state === 1;
        }
        if (this.#children.size > 0) {
            return (Array.from(this.#children.values()).findIndex((child) => {
                return child.state === 1;
            }) !== -1);
        }
        return this.sysInfo.relay_state === 1;
    }
    setRelayState(relayState) {
        if (this.#childId && this.#child !== undefined) {
            this.#child.state = relayState ? 1 : 0;
            return;
        }
        if (this.#children.size > 0) {
            for (const child of this.#children.values()) {
                child.state = relayState ? 1 : 0;
            }
            return;
        }
        this.sysInfo.relay_state = relayState ? 1 : 0;
    }
    /**
     * True if cached value of `sysinfo` has `brightness` property.
     * @returns `true` if cached value of `sysinfo` has `brightness` property.
     */
    get supportsDimmer() {
        return 'brightness' in this.sysInfo;
    }
    /**
     * True if cached value of `sysinfo` has `feature` property that contains 'ENE'.
     * @returns `true` if cached value of `sysinfo` has `feature` property that contains 'ENE'
     */
    get supportsEmeter() {
        return this.sysInfo.feature && typeof this.sysInfo.feature === 'string'
            ? this.sysInfo.feature.includes('ENE')
            : false;
    }
    /**
     * Gets plug's SysInfo.
     *
     * Requests `system.sysinfo` from device. Does not support childId.
  
     */
    async getSysInfo(sendOptions) {
        const response = await super.getSysInfo(sendOptions);
        if (!(0, device_1.isPlugSysinfo)(response)) {
            throw new Error(`Unexpected Response: ${JSON.stringify(response)}`);
        }
        return this.sysInfo;
    }
    /**
     * Requests common Plug status details in a single request.
     * - `system.get_sysinfo`
     * - `cloud.get_sysinfo`
     * - `emeter.get_realtime`
     * - `schedule.get_next_action`
     *
     * This command is likely to fail on some devices when using UDP transport.
     * This defaults to TCP transport unless overridden in sendOptions.
     *
     * Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getInfo(sendOptions) {
        // force TCP unless overridden here
        const sendOptionsForGetInfo = sendOptions == null ? {} : sendOptions;
        if (!('transport' in sendOptionsForGetInfo))
            sendOptionsForGetInfo.transport = 'tcp';
        let data;
        try {
            data = await this.sendCommand('{"emeter":{"get_realtime":{}},"schedule":{"get_next_action":{}},"system":{"get_sysinfo":{}},"cnCloud":{"get_info":{}}}', this.#childId, sendOptionsForGetInfo);
        }
        catch (err) {
            // Ignore emeter section errors as not all devices support it
            if (err instanceof utils_1.ResponseError &&
                err.modules.length === 1 &&
                err.modules[0] === 'emeter') {
                data = JSON.parse(err.response);
            }
            else {
                throw err;
            }
        }
        const sysinfo = (0, utils_1.extractResponse)(data, 'system.get_sysinfo', device_1.isPlugSysinfo);
        this.setSysInfo(sysinfo);
        const cloudInfo = (0, utils_1.extractResponse)(data, 'cnCloud.get_info', (c) => (0, cloud_1.isCloudInfo)(c) && (0, utils_1.hasErrCode)(c));
        this.cloud.info = cloudInfo;
        if ((0, utils_1.isObjectLike)(data) &&
            'emeter' in data &&
            (0, utils_1.isObjectLike)(data.emeter) &&
            'get_realtime' in data.emeter &&
            (0, utils_1.isObjectLike)(data.emeter.get_realtime)) {
            this.emeter.setRealtime(data.emeter.get_realtime);
        }
        const scheduleNextAction = (0, utils_1.extractResponse)(data, 'schedule.get_next_action', utils_1.hasErrCode);
        this.schedule.nextAction = scheduleNextAction;
        return {
            sysInfo: this.sysInfo,
            cloud: { info: this.cloud.info },
            emeter: { realtime: this.emeter.realtime },
            schedule: { nextAction: this.schedule.nextAction },
        };
    }
    /**
     * Same as {@link Plug#inUse}, but requests current `emeter.get_realtime`. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getInUse(sendOptions) {
        if (this.supportsEmeter) {
            await this.emeter.getRealtime(sendOptions);
        }
        else {
            await this.getSysInfo(sendOptions);
        }
        return this.inUse;
    }
    /**
     * Get Plug LED state (night mode).
     *
     * Requests `system.sysinfo` and returns true if `led_off === 0`. Does not support childId.
     * @param  {SendOptions} [sendOptions]
     * @returns LED State, true === on
     * @throws {@link ResponseError}
     */
    async getLedState(sendOptions) {
        const sysInfo = await this.getSysInfo(sendOptions);
        return sysInfo.led_off === 0;
    }
    /**
     * Turn Plug LED on/off (night mode). Does not support childId.
     *
     * Sends `system.set_led_off` command.
     * @param   value - LED State, true === on
     * @throws {@link ResponseError}
     */
    async setLedState(value, sendOptions) {
        await this.sendCommand(`{"system":{"set_led_off":{"off":${value ? 0 : 1}}}}`, undefined, sendOptions);
        this.sysInfo.led_off = value ? 0 : 1;
        return true;
    }
    /**
     * Get Plug relay state (on/off).
     *
     * Requests `system.get_sysinfo` and returns true if On. Calls {@link Plug#relayState}. Supports childId.
     * @throws {@link ResponseError}
     */
    async getPowerState(sendOptions) {
        await this.getSysInfo(sendOptions);
        return this.relayState;
    }
    /**
     * Turns Plug relay on/off.
     *
     * Sends `system.set_relay_state` command. Supports childId.
     * @throws {@link ResponseError}
     */
    async setPowerState(value, sendOptions) {
        await this.sendCommand(`{"system":{"set_relay_state":{"state":${value ? 1 : 0}}}}`, this.#childId, sendOptions);
        this.setRelayState(value);
        this.emitEvents();
        return true;
    }
    /**
     * Toggles Plug relay state.
     *
     * Requests `system.get_sysinfo` sets the power state to the opposite `relay_state === 1 and returns the new power state`. Supports childId.
     * @throws {@link ResponseError}
     */
    async togglePowerState(sendOptions) {
        const powerState = await this.getPowerState(sendOptions);
        await this.setPowerState(!powerState, sendOptions);
        return !powerState;
    }
    /**
     * Blink Plug LED.
     *
     * Sends `system.set_led_off` command alternating on and off number of `times` at `rate`,
     * then sets the led to its pre-blink state. Does not support childId.
     *
     * Note: `system.set_led_off` is particularly slow, so blink rate is not guaranteed.
     * @throws {@link ResponseError}
     */
    async blink(times = 5, rate = 1000, sendOptions) {
        const delay = (t) => {
            return new Promise((resolve) => {
                setTimeout(resolve, t);
            });
        };
        const origLedState = await this.getLedState(sendOptions);
        let lastBlink;
        let currLedState = false;
        for (let i = 0; i < times * 2; i += 1) {
            currLedState = !currLedState;
            lastBlink = Date.now();
            // eslint-disable-next-line no-await-in-loop
            await this.setLedState(currLedState, sendOptions);
            const timeToWait = rate / 2 - (Date.now() - lastBlink);
            if (timeToWait > 0) {
                // eslint-disable-next-line no-await-in-loop
                await delay(timeToWait);
            }
        }
        if (currLedState !== origLedState) {
            await this.setLedState(origLedState, sendOptions);
        }
        return true;
    }
    emitEvents() {
        if (!this.emitEventsEnabled) {
            return;
        }
        const { inUse, relayState } = this;
        this.log.debug('[%s] plug.emitEvents() inUse: %s relayState: %s lastState: %j', this.alias, inUse, relayState, this.lastState);
        if (this.lastState.inUse !== inUse) {
            this.lastState.inUse = inUse;
            if (inUse) {
                this.emit('in-use');
            }
            else {
                this.emit('not-in-use');
            }
        }
        this.emit('in-use-update', inUse);
        if (this.lastState.relayState !== relayState) {
            this.lastState.relayState = relayState;
            if (relayState) {
                this.emit('power-on');
            }
            else {
                this.emit('power-off');
            }
        }
        this.emit('power-update', relayState);
        if (this.supportsDimmer) {
            this.dimmer.emitEvents();
        }
    }
}
exports.default = Plug;
//# sourceMappingURL=index.js.map