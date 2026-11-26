"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlugSysinfo = exports.isBulbSysinfo = exports.isCommonSysinfo = void 0;
const events_1 = require("events");
const lodash_castarray_1 = __importDefault(require("lodash.castarray"));
const tcp_connection_1 = __importDefault(require("../network/tcp-connection"));
const udp_connection_1 = __importDefault(require("../network/udp-connection"));
const utils_1 = require("../utils");
const netif_1 = __importDefault(require("./netif"));
function isCommonSysinfo(candidate) {
    return ((0, utils_1.isObjectLike)(candidate) &&
        'alias' in candidate &&
        'deviceId' in candidate &&
        'model' in candidate &&
        'sw_ver' in candidate &&
        'hw_ver' in candidate);
}
exports.isCommonSysinfo = isCommonSysinfo;
function isBulbSysinfo(candidate) {
    return (isCommonSysinfo(candidate) &&
        'mic_type' in candidate &&
        'mic_mac' in candidate &&
        'description' in candidate &&
        'light_state' in candidate &&
        'is_dimmable' in candidate &&
        'is_color' in candidate &&
        'is_variable_color_temp' in candidate);
}
exports.isBulbSysinfo = isBulbSysinfo;
function isPlugSysinfo(candidate) {
    return (isCommonSysinfo(candidate) &&
        ('type' in candidate || 'mic_type' in candidate) &&
        ('mac' in candidate || 'ethernet_mac' in candidate) &&
        'feature' in candidate &&
        ('relay_state' in candidate || 'children' in candidate));
}
exports.isPlugSysinfo = isPlugSysinfo;
function isSysinfo(candidate) {
    return isPlugSysinfo(candidate) || isBulbSysinfo(candidate);
}
/**
 * TP-Link Device.
 *
 * Abstract class. Shared behavior for {@link Plug} and {@link Bulb}.
 * @fires  Device#emeter-realtime-update
 * @noInheritDoc
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class Device extends events_1.EventEmitter {
    client;
    host;
    port;
    netif = new netif_1.default(this, 'netif');
    log;
    defaultSendOptions;
    udpConnection;
    tcpConnection;
    _sysInfo;
    // eslint-disable-next-line class-methods-use-this
    get childId() {
        return undefined;
    }
    constructor(options) {
        super();
        const { client, 
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _sysInfo, host, port = 9999, logger, defaultSendOptions, } = options;
        // Log first as methods below may call `log`
        this.log = logger || client.log;
        this.log.debug('device.constructor(%j)', {
            // eslint-disable-next-line prefer-rest-params
            ...arguments[0],
            client: 'not shown',
        });
        this.client = client;
        // eslint-disable-next-line no-underscore-dangle
        this._sysInfo = _sysInfo;
        this.host = host;
        this.port = port;
        this.defaultSendOptions = {
            ...client.defaultSendOptions,
            ...defaultSendOptions,
        };
        this.udpConnection = new udp_connection_1.default(this.host, this.port, this.log, this.client);
        this.tcpConnection = new tcp_connection_1.default(this.host, this.port, this.log, this.client);
    }
    /**
     * Returns cached results from last retrieval of `system.sysinfo`.
     * @returns system.sysinfo
     */
    get sysInfo() {
        // eslint-disable-next-line no-underscore-dangle
        return this._sysInfo;
    }
    /**
     * @internal
     */
    setSysInfo(sysInfo) {
        this.log.debug('[%s] device sysInfo set', sysInfo.alias || this.alias);
        // eslint-disable-next-line no-underscore-dangle
        this._sysInfo = sysInfo;
    }
    /**
     * Cached value of `sysinfo.alias`.
     */
    get alias() {
        return this.sysInfo.alias;
    }
    /**
     * Cached value of `sysinfo.deviceId`.
     */
    get id() {
        return this.deviceId;
    }
    /**
     * Cached value of `sysinfo.deviceId`.
     */
    get deviceId() {
        return this.sysInfo.deviceId;
    }
    /**
     * Cached value of `sysinfo.model`.
     */
    get model() {
        return this.sysInfo.model;
    }
    /**
     * Cached value of `sysinfo.alias`.
     */
    get name() {
        return this.alias;
    }
    /**
     * Cached value of `sysinfo.[type|mic_type]`.
     */
    get type() {
        if ('type' in this.sysInfo)
            return this.sysInfo.type;
        if ('mic_type' in this.sysInfo)
            return this.sysInfo.mic_type;
        return '';
    }
    /**
     * Type of device (or `device` if unknown).
     *
     * Based on cached value of `sysinfo.[type|mic_type]`
     */
    get deviceType() {
        const { type } = this;
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
     * Cached value of `sysinfo.sw_ver`.
     */
    get softwareVersion() {
        return this.sysInfo.sw_ver;
    }
    /**
     * Cached value of `sysinfo.hw_ver`.
     */
    get hardwareVersion() {
        return this.sysInfo.hw_ver;
    }
    /**
     * Cached value of `sysinfo.[mac|mic_mac|ethernet_mac]`.
     */
    get mac() {
        if ('mac' in this.sysInfo)
            return this.sysInfo.mac;
        if ('mic_mac' in this.sysInfo)
            return this.sysInfo.mic_mac;
        if ('ethernet_mac' in this.sysInfo)
            return this.sysInfo.ethernet_mac;
        return '';
    }
    /**
     * Normalized cached value of `sysinfo.[mac|mic_mac|ethernet_mac]`
     *
     * Removes all non alphanumeric characters and makes uppercase
     * `aa:bb:cc:00:11:22` will be normalized to `AABBCC001122`
     */
    get macNormalized() {
        const mac = this.mac || '';
        return mac.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    }
    /**
     * Closes any open network connections including any shared sockets.
     */
    closeConnection() {
        this.udpConnection.close();
        this.tcpConnection.close();
    }
    /**
     * Sends `payload` to device (using {@link Client#send})
     * @param   payload - payload to send to device, if object, converted to string via `JSON.stringify`
     * @returns parsed JSON response
     */
    async send(payload, sendOptions) {
        this.log.debug('[%s] device.send()', this.alias);
        try {
            const thisSendOptions = {
                ...this.defaultSendOptions,
                ...sendOptions,
            };
            const payloadString = !(typeof payload === 'string')
                ? JSON.stringify(payload)
                : payload;
            if (thisSendOptions.transport === 'udp') {
                return await this.udpConnection.send(payloadString, this.port, this.host, thisSendOptions);
            }
            return await this.tcpConnection.send(payloadString, this.port, this.host, thisSendOptions);
        }
        catch (err) {
            this.log.error('[%s] device.send() %s', this.alias, err);
            throw err;
        }
    }
    /**
     * @internal
     * @alpha
     */
    async sendSingleCommand(moduleName, methodName, parameters, childIds = this.childId, sendOptions) {
        const payload = {
            [moduleName]: { [methodName]: parameters },
        };
        if (childIds) {
            const childIdsArray = (0, lodash_castarray_1.default)(childIds).map((childId) => this.normalizeChildId(childId));
            payload.context = { child_ids: childIdsArray };
        }
        const payloadString = JSON.stringify(payload);
        const response = await this.send(payloadString, sendOptions);
        const results = (0, utils_1.processSingleCommandResponse)(moduleName, methodName, payloadString, response);
        return results;
    }
    /**
     * Sends command(s) to device.
     *
     * Calls {@link Device#send} and processes the response.
     *
     * - Adds context.child_ids:[] to the command.
     *   - If `childIds` parameter is set. _or_
     *   - If device was instantiated with a childId it will default to that value.
     *
     * - If only one operation was sent:
     *   - Promise fulfills with specific parsed JSON response for command.\
     *     Example: `{system:{get_sysinfo:{}}}`
     *     - resolves to: `{err_code:0,...}`\
     *     - instead of: `{system:{get_sysinfo:{err_code:0,...}}}` (as {@link Device#send} would)
     * - If more than one operation was sent:
     *   - Promise fulfills with full parsed JSON response (same as {@link Device#send})
     *
     * Also, the response's `err_code`(s) are checked, if any are missing or != `0` the Promise is rejected with {@link ResponseError}.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async sendCommand(command, childIds = this.childId, sendOptions) {
        // TODO: allow certain err codes (particularly emeter for non HS110 devices)
        try {
          const commandObj = (typeof command === 'string' ? JSON.parse(command) : command);
          if (childIds) {
              const childIdsArray = (0, lodash_castarray_1.default)(childIds).map((childId) => this.normalizeChildId(childId));
              commandObj.context = { child_ids: childIdsArray };
          }
          const response = await this.send(commandObj, sendOptions);
          const results = (0, utils_1.processResponse)(commandObj, JSON.parse(response));
          return results;
        } catch (err) {
          return [];
        }
    }
    normalizeChildId(childId) {
        if (childId.length === 1) {
            return `${this.deviceId}0${childId}`;
        }
        if (childId.length === 2) {
            return this.deviceId + childId;
        }
        return childId;
    }
    /**
     * Gets device's SysInfo.
     *
     * Requests `system.sysinfo` from device. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getSysInfo(sendOptions) {
        this.log.debug('[%s] device.getSysInfo()', this.alias);
        const response = (0, utils_1.extractResponse)(await this.sendCommand('{"system":{"get_sysinfo":{}}}', undefined, sendOptions), '', isSysinfo);
        this.setSysInfo(response);
        return this.sysInfo;
    }
    /**
     * Change device's alias (name).
     *
     * Sends `system.set_dev_alias` command. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setAlias(alias, sendOptions) {
        await this.sendCommand({
            [this.apiModules.system]: {
                set_dev_alias: { alias },
            },
        }, this.childId, sendOptions);
        this.setAliasProperty(alias);
        return true;
    }
    /**
     * Set device's location.
     *
     * Sends `system.set_dev_location` command. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setLocation(latitude, longitude, sendOptions) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const latitude_i = Math.round(latitude * 10000);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const longitude_i = Math.round(longitude * 10000);
        const response = await this.sendCommand({
            [this.apiModules.system]: {
                set_dev_location: { latitude, longitude, latitude_i, longitude_i },
            },
        }, undefined, sendOptions);
        if ((0, utils_1.isObjectLike)(response))
            return response;
        throw new Error('Unexpected Response');
    }
    /**
     * Gets device's model.
     *
     * Requests `system.sysinfo` and returns model name. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getModel(sendOptions) {
        const sysInfo = await this.getSysInfo(sendOptions);
        return sysInfo.model;
    }
    /**
     * Reboot device.
     *
     * Sends `system.reboot` command. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async reboot(delay, sendOptions) {
        return this.sendCommand({
            [this.apiModules.system]: { reboot: { delay } },
        }, undefined, sendOptions);
    }
    /**
     * Reset device.
     *
     * Sends `system.reset` command. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async reset(delay, sendOptions) {
        return this.sendCommand({
            [this.apiModules.system]: { reset: { delay } },
        }, undefined, sendOptions);
    }
}
exports.default = Device;
//# sourceMappingURL=index.js.map
