/**
 *
 *      ioBroker hs100 Adapter
 *
 *      (c) 2014-2020 arteck <arteck@outlook.com>
 *
 *      MIT License
 *
 */

'use strict';

const utils = require('@iobroker/adapter-core');
const {Client} = require('./lib/tplink-smarthome-api');

const MAX_POWER_VALUE = 10 * 1000; // max value for power consumption: 10 kW
const MIN_INTERVAL = 5000;
const LIGHT_STATE_DATAPOINTS = ['brightness', 'hue', 'saturation', 'color_temp'];

const isBulb = model => /LB/i.test(model);
const hasEmeter = model => /110|115/.test(model);

/**
 * Energy (kWh) of the entry with `field === value`, 0 if not found.
 *
 * @param {Array<any>} list
 * @param {string} field
 * @param {number} value
 * @returns {number}
 */
function findEnergy(list, field, value) {
    const entry = list.find(e => e[field] === value);
    if (!entry) {
        return 0;
    }
    return parseFloat(entry.energy != undefined ? entry.energy : entry.energy_wh / 1000) || 0;
}

class hs100Controll extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options]
     */
    constructor(options) {
        super({
            ...options,
            name: 'hs100',
        });

        this.client = new Client({
            defaultSendOptions: {timeout: 20000, transport: 'tcp'},
        });
        this.interval = MIN_INTERVAL;
        this.requestInterval = null;
        this.polling = false;
        this.unloaded = false;

        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        this.setState('info.connection', false, true);

        await this.initialization();
        await this.create_state();
        await this.getInfos();
        this.startPolling();
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param {() => void} callback
     */
    onUnload(callback) {
        this.unloaded = true;
        try {
            if (this.requestInterval) {
                clearInterval(this.requestInterval);
                this.requestInterval = null;
            }

            this.log.info('cleaned everything up...');
            this.setState('info.connection', false, true);
        } finally {
            callback();
        }
    }

    /**
     * Is called if a subscribed object changes
     *
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        if (obj) {
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            this.log.info(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     *
     * @param {string} stateId
     * @param {ioBroker.State | null | undefined} stateObj
     */
    onStateChange(stateId, stateObj) {
        if (!stateObj || stateObj.ack) {
            return;
        }

        const tmp = stateId.split('.');
        const dp = tmp.pop();
        const idx = tmp.pop();
        const ip = idx.replace(/[_\s]+/g, '.');

        this.setDevice(ip, dp, stateObj);

        this.log.debug(`stateID ${stateId} changed: ${stateObj.val} (ack = ${stateObj.ack})`);
    }

    async setDevice(ip, dp, state) {
        let devName = '';
        try {
            const device = await this.client.getDevice({host: ip});
            if (!device) {
                return;
            }
            devName = device.name;

            if (dp === 'state') {
                await device.setPowerState(state.val);
            } else if (isBulb(device.model) && LIGHT_STATE_DATAPOINTS.includes(dp)) {
                await device.lighting.setLightState({[dp]: state.val});
            } else if (dp === 'ledState' && !isBulb(device.model)) {
                await device.setLedState(state.val);
            }
        } catch (error) {
            this.log.warn(`setDevice ${dp} for IP ${ip} ${devName} failed: ${error && error.message}`);
        }
    }

    startPolling() {
        if (this.requestInterval || this.unloaded) {
            return;
        }
        this.requestInterval = setInterval(() => this.getInfos(), this.interval);
    }

    async getInfos() {
        // skip a cycle if the previous one has not finished yet
        if (this.polling || this.unloaded) {
            return;
        }
        this.polling = true;
        this.log.debug(`get Information`);

        try {
            const devices = (this.config.devices || []).filter(device => device.active);
            await Promise.allSettled(devices.map(device => this.updateDevice(device)));
        } catch (err) {
            this.log.error(`getInfosError ${err && err.message}`);
        } finally {
            this.polling = false;
        }
    }

    async updateDevice(device) {
        const ip = device.ip;
        const dev_name = device.name;
        const ip_state = this.ip_replace(ip);

        try {
            const result = await this.client.getDevice({host: ip});
            if (!result) {
                return;
            }

            const hs_model = await this.hs_all_info(result, ip_state);
            const hs_state = isBulb(hs_model)
                ? result.sysInfo.light_state.on_off != 0
                : result.sysInfo.relay_state != 0;

            this.setForeignState(`${this.namespace}.${ip_state}.state`, hs_state, true);
            this.setForeignState(`${this.namespace}.${ip_state}.last_update`, Date.now(), true);

            if (hasEmeter(hs_model)) {
                await this.hs_getRealtime(result, ip_state, dev_name);
            }

            if (isBulb(hs_model) || hasEmeter(hs_model)) {
                await this.hs_getMonthStats(result, ip_state, dev_name);
                await this.hs_getDayStats(result, ip_state, dev_name);
            }

            if (isBulb(hs_model)) {
                await this.lb_dimmable(result, ip_state);
            }
            // bulb KL60
            if (/KL/i.test(hs_model)) {
                const kl_bright = result.sysInfo.light_state.brightness;
                this.setForeignState(`${this.namespace}.${ip_state}.brightness`, kl_bright, true);
            }
        } catch (err) {
            if (!this.config.warning) {
                this.log.warn(`Socket connection Timeout ${ip_state} ${dev_name} please reconnect the Device`);
            }
        }
    }

    async hs_all_info(result, ip_state) {
        const hs_model = result.model;

        this.setForeignState(`${this.namespace}.${ip_state}.sw_ver`, result.softwareVersion || 'undefined', true);
        this.setForeignState(`${this.namespace}.${ip_state}.hw_ver`, result.hardwareVersion || 'undefined', true);
        this.setForeignState(`${this.namespace}.${ip_state}.model`, hs_model || 'undefined', true);
        this.setForeignState(`${this.namespace}.${ip_state}.mac`, result.mac || 'undefined', true);

        return hs_model;
    }

    async hs_getDayStats(result, ip_state, dev_name) {
        const dat = new Date();

        try {
            const resultDayStats = await result.emeter.getDayStats(dat.getFullYear(), dat.getMonth() + 1);
            if (resultDayStats.day_list != undefined) {
                const energy = findEnergy(resultDayStats.day_list, 'day', dat.getDate());
                this.setForeignState(`${this.namespace}.${ip_state}.totalNow`, energy, true);
            }
        } catch (err) {
            this.log.error(`result.emeter.getDayStats ${ip_state} ${dev_name}: ${err && err.message}`);
        }
    }

    async hs_getMonthStats(result, ip_state, dev_name) {
        const dat = new Date();

        try {
            const resultMonthStats = await result.emeter.getMonthStats(dat.getFullYear());
            if (resultMonthStats.month_list != undefined) {
                const energy = findEnergy(resultMonthStats.month_list, 'month', dat.getMonth() + 1);
                this.setForeignState(`${this.namespace}.${ip_state}.totalMonthNow`, energy, true);
            }
        } catch (err) {
            this.log.error(`result.emeter.getMonthStats ${ip_state} ${dev_name}: ${err && err.message}`);
        }
    }

    async hs_getRealtime(result, ip_state, dev_name) {
        const hs_hw_ver = result.hardwareVersion;

        let hs_current;
        let hs_power;
        let hs_voltage;

        try {
            const resultRealtime = await result.emeter.getRealtime();
            if (typeof resultRealtime === 'undefined') {
                return;
            }

            if (hs_hw_ver == '2.0' || hs_hw_ver == '3.0') {
                hs_current = resultRealtime.current_ma;
                hs_power = resultRealtime.power_mw > 0 ? resultRealtime.power_mw / 1000 : resultRealtime.power_mw;
                hs_voltage = resultRealtime.voltage_mv > 0 ? resultRealtime.voltage_mv / 1000 : resultRealtime.voltage_mv;
            } else {
                hs_current = resultRealtime.current;
                hs_power = resultRealtime.power;
                hs_voltage = Math.ceil(resultRealtime.voltage);
            }

            const hs_led = result.sysInfo.led_off == 0;

            this.setForeignState(`${this.namespace}.${ip_state}.current`, parseFloat(hs_current) || 0, true);

            if (hs_power < MAX_POWER_VALUE) {
                this.setForeignState(`${this.namespace}.${ip_state}.power`, parseFloat(hs_power) || 0, true);
            }

            this.setForeignState(`${this.namespace}.${ip_state}.voltage`, parseFloat(hs_voltage) || 0, true);
            this.setForeignState(`${this.namespace}.${ip_state}.ledState`, hs_led, true);
            this.log.debug(`Refresh Data HS110 ${ip_state} ${dev_name}`);
        } catch (err) {
            this.log.error(`Error in hs_getRealtime ${ip_state} ${dev_name}: ${err && err.message}`);
        }
    }

    async lb_dimmable(result, ip_state) {
        if (result.sysInfo.is_dimmable == 1) {
            const lightState = result.sysInfo.light_state;

            this.setForeignState(`${this.namespace}.${ip_state}.brightness`, lightState.brightness, true);
            this.setForeignState(`${this.namespace}.${ip_state}.color_temp`, lightState.color_temp, true);
            this.setForeignState(`${this.namespace}.${ip_state}.hue`, lightState.hue, true);
            this.setForeignState(`${this.namespace}.${ip_state}.saturation`, lightState.saturation, true);
        }
    }

    async create_state() {
        this.log.debug(`create state`);

        try {
            for (const device of this.config.devices || []) {
                if (device.active) {
                    this.log.info(`Start with ${device.ip} ${device.name} `);
                    await this.cre_state(device.ip, device.name);
                }
            }

            this.setState('info.connection', true, true);
        } catch (err) {
            this.log.debug(`create state problem`);
        }
    }

    ip_replace(ip) {
        return ip.replace(/[.\s]+/g, '_');
    }

    /**
     * @param {string} ip_state
     * @param {string} id
     * @param {string} name
     * @param {Record<string, any>} common
     */
    async createDeviceState(ip_state, id, name, common) {
        await this.extendObjectAsync(`${ip_state}.${id}`, {
            type: 'state',
            common: {
                name,
                read: true,
                write: false,
                ...common,
            },
            native: {},
        });
    }

    async cre_state(ip, devName) {
        let hs_model;

        try {
            this.log.debug(`create_state for IP : ${ip}`);

            const result = await this.client.getDevice({host: ip});

            if (result) {
                hs_model = result.model;
                const hs_state = result.sysInfo.relay_state != 0;
                const ip_state = this.ip_replace(ip);
                const name = devName || ip;
                const create = (id, common) => this.createDeviceState(ip_state, id, name, common);

                await this.extendObjectAsync(ip_state, {
                    type: 'device',
                    common: {name},
                    native: {},
                });

                await create('state', {write: true, type: 'boolean', def: hs_state, role: 'switch', desc: 'Switch on/off'});
                await create('last_update', {type: 'number', role: 'value.time', desc: 'last update'});
                await create('mac', {type: 'string', def: result.mac, role: 'value', desc: 'Mac address'});
                await create('sw_ver', {type: 'string', def: result.softwareVersion, role: 'value', desc: 'Software Version'});
                await create('hw_ver', {type: 'string', def: result.hardwareVersion, role: 'value', desc: 'Hardware Version'});
                await create('model', {type: 'string', def: hs_model, role: 'value', desc: 'Model'});

                // plug HS110
                if (hasEmeter(hs_model)) {
                    await create('current', {type: 'number', def: 0, role: 'value.current', unit: 'mA', desc: 'current value'});
                    await create('power', {type: 'number', unit: 'W', def: 0, role: 'value', desc: 'power value'});
                    await create('voltage', {type: 'number', def: 0, role: 'value.voltage', unit: 'V', desc: 'voltage value'});
                    await create('ledState', {type: 'boolean', def: result.sysInfo.led_off == 0, role: 'switch', desc: 'Led on/off'});
                }

                // bulb LBxxx
                if (isBulb(hs_model)) {
                    await create('brightness', {type: 'number', def: 100, role: 'value', desc: 'brightness'});
                    await create('saturation', {type: 'number', def: 100, role: 'value', desc: 'saturation'});
                    await create('hue', {type: 'number', def: 0, role: 'value', desc: 'color'});
                    await create('color_temp', {type: 'number', def: 2700, role: 'value', desc: 'color_temp'});
                }

                if (isBulb(hs_model) || hasEmeter(hs_model)) {
                    await create('totalNow', {type: 'number', def: 0, role: 'value', unit: 'kWh', desc: 'total now value'});
                    await create('totalMonthNow', {type: 'number', def: 0, role: 'value', unit: 'kWh', desc: 'total month now value'});
                }
            }

            this.subscribeForeignStates(`${this.namespace}.${this.ip_replace(ip)}.state`);

            this.log.debug(`${hs_model} generated ${ip}`);
        } catch (error) {
            this.log.warn(`Could not create states for ${ip}: ${error && error.message}`);
        }
    }

    async initialization() {
        if (this.config.devices === undefined) {
            this.log.debug(`initialization undefined No one IP configured`);
        }

        const seconds = Number(this.config.interval);
        this.interval = Math.max(MIN_INTERVAL, Number.isFinite(seconds) ? seconds * 1000 : 0);
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options]
     */
    module.exports = options => new hs100Controll(options);
} else {
    // otherwise start the instance directly
    new hs100Controll();
}
