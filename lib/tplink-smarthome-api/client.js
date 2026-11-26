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
const dgram_1 = require("dgram");
const events_1 = require("events");
const util_1 = __importDefault(require("util"));
const tplink_smarthome_crypto_1 = require("tplink-smarthome-crypto");
const bulb_1 = __importDefault(require("./bulb"));
const device_1 = __importStar(require("./device"));
const logger_1 = __importDefault(require("./logger"));
const tcp_connection_1 = __importDefault(require("./network/tcp-connection"));
const udp_connection_1 = __importDefault(require("./network/udp-connection"));
const plug_1 = __importStar(require("./plug"));
const utils_1 = require("./utils");
const discoveryMsgBuf = (0, tplink_smarthome_crypto_1.encrypt)('{"system":{"get_sysinfo":{}}}');
function isSysinfoResponse(candidate) {
    return ((0, utils_1.isObjectLike)(candidate) &&
        'system' in candidate &&
        (0, utils_1.isObjectLike)(candidate.system) &&
        'get_sysinfo' in candidate.system);
}
/**
 * Client that sends commands to specified devices or discover devices on the local subnet.
 * - Contains factory methods to create devices.
 * - Events are emitted after {@link Client#startDiscovery} is called.
 * @noInheritDoc
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class Client extends events_1.EventEmitter {
    defaultSendOptions = {
        timeout: 10000,
        transport: 'tcp',
        useSharedSocket: false,
        sharedSocketTimeout: 20000,
    };
    log;
    devices = new Map();
    discoveryTimer = null;
    discoveryPacketSequence = 0;
    maxSocketId = 0;
    socket;
    isSocketBound = false;
    constructor(options = {}) {
        super();
        const { defaultSendOptions, logLevel = 'warn', logger } = options;
        this.defaultSendOptions = {
            ...this.defaultSendOptions,
            ...defaultSendOptions,
        };
        this.log = (0, logger_1.default)({ logger, level: logLevel });
    }
    /**
     * Used by `tplink-connection`
     * @internal
     */
    getNextSocketId() {
        this.maxSocketId += 1;
        return this.maxSocketId;
    }
    /**
     * {@link https://github.com/plasticrake/tplink-smarthome-crypto | Encrypts} `payload` and sends to device.
     * - If `payload` is not a string, it is `JSON.stringify`'d.
     * - Promise fulfills with encrypted string response.
     *
     * Devices use JSON to communicate.\
     * For Example:
     * - If a device receives:
     *   - `{"system":{"get_sysinfo":{}}}`
     * - It responds with:
     * ```
     *     {"system":{"get_sysinfo":{
     *       err_code: 0,
     *       sw_ver: "1.0.8 Build 151113 Rel.24658",
     *       hw_ver: "1.0",
     *       ...
     *     }}}
     * ```
     *
     * All responses from device contain an `err_code` (`0` is success).
     *
     * @returns decrypted string response
     */
    async send(payload, host, port = 9999, sendOptions) {
        const thisSendOptions = {
            ...this.defaultSendOptions,
            ...sendOptions,
            useSharedSocket: false,
        };
        const payloadString = !(typeof payload === 'string')
            ? JSON.stringify(payload)
            : payload;
        let connection;
        if (thisSendOptions.transport === 'udp') {
            connection = new udp_connection_1.default(host, port, this.log, this);
        }
        else {
            connection = new tcp_connection_1.default(host, port, this.log, this);
        }
        const response = await connection.send(payloadString, port, host, thisSendOptions);
        connection.close();
        return response;
    }
    /**
     * Requests `{system:{get_sysinfo:{}}}` from device.
     *
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     * @throws Error
     */
    async getSysInfo(host, port = 9999, sendOptions) {
        this.log.debug('client.getSysInfo(%j)', { host, port, sendOptions });
        const response = await this.send('{"system":{"get_sysinfo":{}}}', host, port, sendOptions);
        const responseObj = JSON.parse(response);
        if (isSysinfoResponse(responseObj)) {
            return responseObj.system.get_sysinfo;
        }
        throw new Error(`Unexpected Response: ${response}`);
    }
    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emit(eventName, ...args) {
        // Add device- / plug- / bulb- to eventName
        let ret = false;
        if (args[0] instanceof device_1.default) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            if (super.emit(`device-${eventName}`, ...args)) {
                ret = true;
            }
            if (args[0].deviceType !== 'device') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                if (super.emit(`${args[0].deviceType}-${eventName}`, ...args)) {
                    ret = true;
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        }
        else if (super.emit(eventName, ...args)) {
            ret = true;
        }
        return ret;
    }
    /**
     * Creates Bulb object.
     *
     * See [Device constructor]{@link Device} and [Bulb constructor]{@link Bulb} for valid options.
     * @param   deviceOptions - passed to [Bulb constructor]{@link Bulb}
     */
    getBulb(deviceOptions) {
        return new bulb_1.default({
            defaultSendOptions: this.defaultSendOptions,
            ...deviceOptions,
            client: this,
        });
    }
    /**
     * Creates {@link Plug} object.
     *
     * See [Device constructor]{@link Device} and [Plug constructor]{@link Plug} for valid options.
     * @param   deviceOptions - passed to [Plug constructor]{@link Plug}
     */
    getPlug(deviceOptions) {
        return new plug_1.default({
            defaultSendOptions: this.defaultSendOptions,
            ...deviceOptions,
            client: this,
        });
    }
    /**
     * Creates a {@link Plug} or {@link Bulb} from passed in sysInfo or after querying device to determine type.
     *
     * See [Device constructor]{@link Device}, [Bulb constructor]{@link Bulb}, [Plug constructor]{@link Plug} for valid options.
     * @param   deviceOptions - passed to [Device constructor]{@link Device}
     * @throws {@link ResponseError}
     */
    async getDevice(deviceOptions, sendOptions) {
        this.log.debug('client.getDevice(%j)', { deviceOptions, sendOptions });
        let sysInfo;
        if ('sysInfo' in deviceOptions && deviceOptions.sysInfo !== undefined) {
            sysInfo = deviceOptions.sysInfo;
        }
        else {
            sysInfo = await this.getSysInfo(deviceOptions.host, deviceOptions.port, sendOptions);
        }
        const combinedDeviceOptions = {
            ...deviceOptions,
            client: this,
        };
        return this.getDeviceFromSysInfo(sysInfo, combinedDeviceOptions);
    }
    /**
     * Creates device corresponding to the provided `sysInfo`.
     *
     * See [Device constructor]{@link Device}, [Bulb constructor]{@link Bulb}, [Plug constructor]{@link Plug} for valid options
     * @param  deviceOptions - passed to device constructor
     * @throws Error
     */
    getDeviceFromSysInfo(sysInfo, deviceOptions) {
        if ((0, device_1.isPlugSysinfo)(sysInfo)) {
            return this.getPlug({ ...deviceOptions, sysInfo });
        }
        if ((0, device_1.isBulbSysinfo)(sysInfo)) {
            return this.getBulb({ ...deviceOptions, sysInfo });
        }
        throw new Error('Could not determine device from sysinfo');
    }
    /**
     * Guess the device type from provided `sysInfo`.
     *
     * Based on sysinfo.[type|mic_type]
     */
    // eslint-disable-next-line class-methods-use-this
    getTypeFromSysInfo(sysInfo) {
        const type = 'type' in sysInfo ? sysInfo.type : sysInfo.mic_type;
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
     * Discover TP-Link Smarthome devices on the network.
     *
     * - Sends a discovery packet (via UDP) to the `broadcast` address every `discoveryInterval`(ms).
     * - Stops discovery after `discoveryTimeout`(ms) (if `0`, runs until {@link Client.stopDiscovery} is called).
     *   - If a device does not respond after `offlineTolerance` number of attempts, {@link ClientEvents.device-offline} is emitted.
     * - If `deviceTypes` are specified only matching devices are found.
     * - If `macAddresses` are specified only devices with matching MAC addresses are found.
     * - If `excludeMacAddresses` are specified devices with matching MAC addresses are excluded.
     * - if `filterCallback` is specified only devices where the callback returns a truthy value are found.
     * - If `devices` are specified it will attempt to contact them directly in addition to sending to the broadcast address.
     *   - `devices` are specified as an array of `[{host, [port: 9999]}]`.
     * @fires  Client#error
     * @fires  Client#device-new
     * @fires  Client#device-online
     * @fires  Client#device-offline
     * @fires  Client#bulb-new
     * @fires  Client#bulb-online
     * @fires  Client#bulb-offline
     * @fires  Client#plug-new
     * @fires  Client#plug-online
     * @fires  Client#plug-offline
     * @fires  Client#discovery-invalid
     */
    startDiscovery(options = {}) {
        this.log.debug('client.startDiscovery(%j)', options);
        const { address, port, broadcast = '255.255.255.255', discoveryInterval = 10000, discoveryTimeout = 0, offlineTolerance = 3, deviceTypes, macAddresses = [], excludeMacAddresses = [], filterCallback, breakoutChildren = true, devicesUseDiscoveryPort = false, deviceOptions, devices, } = options;
        try {
            const socket = (0, dgram_1.createSocket)('udp4');
            this.socket = socket;
            socket.on('message', (msg, rinfo) => {
                const decryptedMsg = (0, tplink_smarthome_crypto_1.decrypt)(msg).toString('utf8');
                this.log.debug(`client.startDiscovery(): socket:message From: ${rinfo.address} ${rinfo.port} Message: ${decryptedMsg}`);
                try {
                    // TODO: Type checking of response/sysInfo could be improved
                    let response;
                    let sysInfo;
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        response = JSON.parse(decryptedMsg);
                        sysInfo = response.system.get_sysinfo;
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                        if (sysInfo == null)
                            throw new Error('system.get_sysinfo is null or undefined');
                        if (!(0, utils_1.isObjectLike)(sysInfo))
                            throw new Error('system.get_sysinfo is not an object');
                    }
                    catch (err) {
                        this.log.debug(`client.startDiscovery(): Error parsing JSON: %s\nFrom: ${rinfo.address} ${rinfo.port} Original: [%s] Decrypted: [${decryptedMsg}]`, err, msg);
                        this.emit('discovery-invalid', {
                            rinfo,
                            response: msg,
                            decryptedResponse: decryptedMsg,
                        });
                        return;
                    }
                    if (deviceTypes && deviceTypes.length > 0) {
                        const deviceType = this.getTypeFromSysInfo(sysInfo);
                        if (!deviceTypes.includes(deviceType)) {
                            this.log.debug(`client.startDiscovery(): Filtered out: ${sysInfo.alias} [${sysInfo.deviceId}] (${deviceType}), allowed device types: (%j)`, deviceTypes);
                            return;
                        }
                    }
                    let mac;
                    if ('mac' in sysInfo)
                        mac = sysInfo.mac;
                    else if ('mic_mac' in sysInfo)
                        mac = sysInfo.mic_mac;
                    else if ('ethernet_mac' in sysInfo)
                        mac = sysInfo.ethernet_mac;
                    else
                        mac = '';
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (macAddresses && macAddresses.length > 0) {
                        if (!(0, utils_1.compareMac)(mac, macAddresses)) {
                            this.log.debug(`client.startDiscovery(): Filtered out: ${sysInfo.alias} [${sysInfo.deviceId}] (${mac}), allowed macs: (%j)`, macAddresses);
                            return;
                        }
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    if (excludeMacAddresses && excludeMacAddresses.length > 0) {
                        if ((0, utils_1.compareMac)(mac, excludeMacAddresses)) {
                            this.log.debug(`client.startDiscovery(): Filtered out: ${sysInfo.alias} [${sysInfo.deviceId}] (${mac}), excluded mac`);
                            return;
                        }
                    }
                    if (typeof filterCallback === 'function') {
                        if (!filterCallback(sysInfo)) {
                            this.log.debug(`client.startDiscovery(): Filtered out: ${sysInfo.alias} [${sysInfo.deviceId}], callback`);
                            return;
                        }
                    }
                    this.createOrUpdateDeviceFromSysInfo({
                        sysInfo,
                        host: rinfo.address,
                        port: devicesUseDiscoveryPort ? rinfo.port : undefined,
                        breakoutChildren,
                        options: deviceOptions,
                    });
                }
                catch (err) {
                    this.log.debug(`client.startDiscovery(): Error processing response: %s\nFrom: ${rinfo.address} ${rinfo.port} Original: [%s] Decrypted: [${decryptedMsg}]`, err, msg);
                    this.emit('discovery-invalid', {
                        rinfo,
                        response: msg,
                        decryptedResponse: (0, tplink_smarthome_crypto_1.decrypt)(msg),
                    });
                }
            });
            socket.on('error', (err) => {
                this.log.error('client.startDiscovery: UDP Error: %s', err);
                this.stopDiscovery();
                this.emit('error', err);
                // TODO
            });
            socket.bind(port, address, () => {
                this.isSocketBound = true;
                const sockAddress = socket.address();
                this.log.debug(`client.socket: UDP ${sockAddress.family} listening on ${sockAddress.address}:${sockAddress.port}`);
                socket.setBroadcast(true);
                this.discoveryTimer = setInterval(() => {
                    this.sendDiscovery(socket, broadcast, devices ?? [], offlineTolerance);
                }, discoveryInterval);
                this.sendDiscovery(socket, broadcast, devices ?? [], offlineTolerance);
                if (discoveryTimeout > 0) {
                    setTimeout(() => {
                        this.log.debug('client.startDiscovery: discoveryTimeout reached, stopping discovery');
                        this.stopDiscovery();
                    }, discoveryTimeout);
                }
            });
        }
        catch (err) {
            this.log.error('client.startDiscovery: %s', err);
            this.emit('error', err);
        }
        return this;
    }
    static setSysInfoForDevice(device, sysInfo) {
        if (device instanceof plug_1.default) {
            if (!(0, device_1.isPlugSysinfo)(sysInfo)) {
                throw new TypeError(util_1.default.format('Expected PlugSysinfo but received: %O', sysInfo));
            }
            device.setSysInfo(sysInfo);
        }
        else if (device instanceof bulb_1.default) {
            if (!(0, device_1.isBulbSysinfo)(sysInfo)) {
                throw new TypeError(util_1.default.format('Expected BulbSysinfo but received: %O', sysInfo));
            }
            device.setSysInfo(sysInfo);
        }
    }
    createOrUpdateDeviceFromSysInfo({ sysInfo, host, port, options, breakoutChildren, }) {
        const process = (id, childId) => {
            let device;
            if (this.devices.has(id) && this.devices.get(id) !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                device = this.devices.get(id);
                device.host = host;
                if (port != null)
                    device.port = port;
                Client.setSysInfoForDevice(device, sysInfo);
                device.status = 'online';
                device.seenOnDiscovery = this.discoveryPacketSequence;
                this.emit('online', device);
            }
            else {
                const opts = {
                    ...options,
                    client: this,
                    host,
                    childId,
                };
                if (port != null)
                    opts.port = port;
                device = this.getDeviceFromSysInfo(sysInfo, opts);
                device.status = 'online';
                device.seenOnDiscovery = this.discoveryPacketSequence;
                this.devices.set(id, device);
                this.emit('new', device);
            }
        };
        if (breakoutChildren && (0, plug_1.hasSysinfoChildren)(sysInfo)) {
            sysInfo.children.forEach((child) => {
                const childId = child.id.length === 2 ? sysInfo.deviceId + child.id : child.id;
                process(childId, childId);
            });
        }
        else {
            process(sysInfo.deviceId);
        }
    }
    /**
     * Stops discovery and closes UDP socket.
     */
    stopDiscovery() {
        this.log.debug('client.stopDiscovery()');
        if (this.discoveryTimer !== null)
            clearInterval(this.discoveryTimer);
        this.discoveryTimer = null;
        if (this.isSocketBound) {
            this.isSocketBound = false;
            if (this.socket != null)
                this.socket.close();
        }
    }
    sendDiscovery(socket, address, devices, offlineTolerance) {
        this.log.debug('client.sendDiscovery(%s, %j, %s)', address, devices, offlineTolerance);
        try {
            this.devices.forEach((device) => {
                if (device.status !== 'offline') {
                    const diff = this.discoveryPacketSequence - (device.seenOnDiscovery || 0);
                    if (diff >= offlineTolerance) {
                        // eslint-disable-next-line no-param-reassign
                        device.status = 'offline';
                        this.emit('offline', device);
                    }
                }
            });
            // sometimes there is a race condition with setInterval where this is called after it was cleared
            // check and exit
            if (!this.isSocketBound) {
                return;
            }
            socket.send(discoveryMsgBuf, 0, discoveryMsgBuf.length, 9999, address);
            devices.forEach((d) => {
                this.log.debug('client.sendDiscovery() direct device:', d);
                socket.send(discoveryMsgBuf, 0, discoveryMsgBuf.length, d.port || 9999, d.host);
            });
            if (this.discoveryPacketSequence >= Number.MAX_VALUE) {
                this.discoveryPacketSequence = 0;
            }
            else {
                this.discoveryPacketSequence += 1;
            }
        }
        catch (err) {
            this.log.error('client.sendDiscovery: %s', err);
            this.emit('error', err);
        }
    }
}
exports.default = Client;
//# sourceMappingURL=client.js.map