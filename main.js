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
const {Client} = require('tplink-smarthome-api');
const client = new Client({
    defaultSendOptions: {timeout: 20000, transport: 'tcp'},
});
const MAX_POWER_VALUE = 10 * 1000; // max value for power consumption: 10 kW

let interval = 0;
let _requestInterval = null;

class hs100Controll extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'hs100',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        //  this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));

    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        this.setState('info.connection', false, true);

        await this.initialization();
        await this.create_state();
        this.getInfos();
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if (_requestInterval) clearInterval(_requestInterval);

            this.log.info('cleaned everything up...');
            this.setState('info.connection', false, true);
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed object changes
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {

        if (state) {
            // The state was changed

            let tmp = id.split('.');
            let dp = tmp.pop();

            let idx = tmp.pop();
            let ip = idx.replace(/[_\s]+/g, '.');

            this.setDevice(ip, dp, state);

            this.log.debug(`stateID ${id} changed: ${state.val} (ack = ${state.ack})`);

        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }


    async setDevice(ip, dp, state) {
        try {
            const device = await client.getDevice({host: ip});

            if (device.model.search(/LB/i) != -1) {
                let lightstate = device.sysInfo.light_state;

                if (state && state.ack != null) {
                    if (!state.ack) {
                        if (dp == 'state') {
                            device.setPowerState(state.val).catch(err => {
                                this.log.warn('setPowerState Socket connection Timeout : ' + ip);
                            });
                        } else {
                            //findAndReplace(lightstate, dp, state.val);
                            device.lighting.setLightState(lightstate).catch(err => {
                                this.log.warn('setLightState Socket connection Timeout : ' + ip);
                            });
                        }
                    }
                }
            } else {
                if (state && !state.ack) {
                    if (dp == 'state') {
                        device.setPowerState(state.val).catch(err => {
                            this.log.warn('LB setPowerState Socket connection Timeout : ' + ip);
                        });
                    } else {
                        if (dp == 'ledState') {
                            device.setLedState(state.val).catch(err => {
                                this.log.warn('LB setLedState Socket connection Timeout : ' + ip);
                            });
                        }
                    }
                }
            }

        } catch (error) {
            this.log.warn(`Info Message setDevice for IP ${ip} : ${error.stack}`);
        }
    }

    async getInfos() {
        this.log.debug(`get Information`);

        let devices = this.config.devices;

        try {
            for (const i in devices) {
                if (devices[i].active) {
                    this.updateDevice(devices[i]);
                }
            }
            
            if (!_requestInterval) {
                _requestInterval= setInterval(async () => {
                    await this.getInfos();
                }, interval);
            }
        } catch (err) {
            this.log.error('getInfosError ' + JSON.stringify(err));
        }
    }

    async updateDevice(device) {

        let hs_state;

        const ip = device.ip;
        const dev_name = device.name;
        const ip_state = await this.ip_replace(ip);

        try {
            const result = await client.getDevice({host: ip});

            if (result) {
                const hs_lastupdate =  Number(Date.now());

                const hs_model  = await this.hs_all_info(result,ip_state);

                if (hs_model.search(/LB/i) != -1) {
                    hs_state = result.sysInfo.light_state.on_off == 0 ? false : true;
                } else {
                    hs_state = result.sysInfo.relay_state == 0 ? false : true;
                }

                this.setForeignState(`${this.namespace}.${ip_state}.state`, hs_state, true);
                this.setForeignState(`${this.namespace}.${ip_state}.last_update`, hs_lastupdate, true);

                if (hs_model.search(/110/i) != -1 || hs_model.search(/115/i) != -1) {
                    await this.hs_getRealtime(result,ip_state,dev_name);
                }

                if (hs_model.search(/LB/i) != -1 || hs_model.search(/110/i) != -1 || hs_model.search(/115/i) != -1) {
                    await this.hs_getMonthStats(result,ip_state,dev_name);
                    await this.hs_getDayStats(result,ip_state,dev_name);
                }

                // Bulb
                if (hs_model.search(/LB/i) != -1) {
                    await this.lb_dimmable(result,ip_state,dev_name);
                }
                // bulb KL60
                if (hs_model.search(/KL/i) != -1) {
                    const kl_bright = result.sysInfo.light_state.brightness;
                    this.setForeignState(`${this.namespace}.${ip_state}.brightness`, kl_bright, true);
                }
            }
        } catch (err) {
            if (!this.config.warning) {
                this.log.warn(`Socket connection Timeout ${ip_state} ${dev_name} please reconnect the Device`);
            }
        }
    }

    async hs_all_info(result,ip_state) {

        const hs_mac    = result.mac;
        const hs_sw_ver = result.softwareVersion;
        const hs_hw_ver = result.hardwareVersion;
        const hs_model  = result.model;

        this.setForeignState(`${this.namespace}.${ip_state}.sw_ver`, hs_sw_ver || 'undefined', true);
        this.setForeignState(`${this.namespace}.${ip_state}.hw_ver`, hs_hw_ver || 'undefined', true);
        this.setForeignState(`${this.namespace}.${ip_state}.model`, hs_model || 'undefined', true);
        this.setForeignState(`${this.namespace}.${ip_state}.mac`, hs_mac || 'undefined', true);

        return hs_model;

    }

    async hs_getDayStats(result,ip_state,dev_name) {
        const dat = new Date();

        let jahr = dat.getFullYear();
        let monat = dat.getMonth() + 1;  // von 0 - 11 also +1
        let tag = dat.getDate();

        try {
            result.emeter.getDayStats(jahr, monat).then((resultDayStats) => {

                let dayList = resultDayStats.day_list;
                let energy_v = 0;
                for (let i = 0; i < dayList.length; i++) {
                    if (dayList[i].day === tag) {
                        if (dayList[i].energy != undefined) {
                            energy_v = dayList[i].energy;
                            break;
                        } else {
                            energy_v = dayList[i].energy_wh / 1000;
                            break;
                        }
                    }
                }
                this.setForeignState(`${this.namespace}.${ip_state}.totalNow`, parseFloat(energy_v) || 0, true);
            });
        } catch (err) {
            this.log.error(`result.emeter.getDayStats ${ip_state} ${dev_name}`);
        }
    }

    async lb_dimmable(result,ip_state) {
        if (result.sysInfo.is_dimmable == 1) {

            //this.log.warn('result lb110 --->>>> : ' +  JSON.stringify(result));
            //let devLight = result.lighting.getLightState();
            const lb_bright         = result.sysInfo.light_state.brightness;
            const lb_color_temp     = result.sysInfo.light_state.color_temp;
            const lb_hue            = result.sysInfo.light_state.hue;
            const lb_saturation     = result.sysInfo.light_state.saturation;

            this.setForeignState(`${this.namespace}.${ip_state}.brightness`, lb_bright, true);
            this.setForeignState(`${this.namespace}.${ip_state}.color_temp`, lb_color_temp, true);
            this.setForeignState(`${this.namespace}.${ip_state}.hue`, lb_hue, true);
            this.setForeignState(`${this.namespace}.${ip_state}.saturation`, lb_saturation, true);
        }
    }

    async hs_getMonthStats(result,ip_state,dev_name) {
        const dat = new Date();

        let jahr = dat.getFullYear();
        let monat = dat.getMonth() + 1;  // von 0 - 11 also +1

        try {
            result.emeter.getMonthStats(jahr).then((resultMonthStats) => {
                let mothList = resultMonthStats.month_list;
                let energy_v = 0;
                if (mothList != undefined) {
                  for (let i = 0; i < mothList.length; i++) {
                      if (mothList[i].month === monat) {
                          if (mothList[i].energy != undefined) {
                              energy_v = mothList[i].energy;
                              break;
                          } else {
                              energy_v = mothList[i].energy_wh / 1000;
                              break;
                          }
                      }
                  }
                  this.setForeignState(`${this.namespace}.${ip_state}.totalMonthNow`, parseFloat(energy_v) || 0, true);
                }
            });
        } catch (err) {
            this.log.error(`result.emeter.getMonthStats ${ip_state} ${dev_name}`);
        }
    }

    async hs_getRealtime(result,ip_state,dev_name) {

        const hs_hw_ver = result.hardwareVersion;

        let hs_current;
        let hs_power;
        let hs_voltage;

        try {
            result.emeter.getRealtime().then((resultRealtime) => {
                if (typeof resultRealtime != "undefined") {
                    if (hs_hw_ver == "2.0" || hs_hw_ver == "3.0") {
                        hs_current = resultRealtime.current_ma;

                        if (resultRealtime.power_mw > 0) {
                            hs_power = resultRealtime.power_mw / 1000;
                        } else {
                            hs_power = resultRealtime.power_mw;
                        }

                        if (resultRealtime.voltage_mv > 0) {
                            hs_voltage = resultRealtime.voltage_mv / 1000;
                        } else {
                            hs_voltage = resultRealtime.voltage_mv;
                        }
                    } else {
                        hs_current = resultRealtime.current;
                        hs_power   = resultRealtime.power;                        
                        hs_voltage = Math.ceil(resultRealtime.voltage);
                    }

                    const hs_led = result.sysInfo.led_off == 0 ? true : false;

                    this.setForeignState(`${this.namespace}.${ip_state}.current`, parseFloat(hs_current) || 0, true);

                    if (hs_power < MAX_POWER_VALUE) {
                        this.setForeignState(`${this.namespace}.${ip_state}.power`, parseFloat(hs_power) || 0, true);
                    }

                    this.setForeignState(`${this.namespace}.${ip_state}.voltage`, parseFloat(hs_voltage) || 0, true);
                    this.setForeignState(`${this.namespace}.${ip_state}.ledState`, hs_led, true);
                    this.log.debug(`Refresh Data HS110 ${ip_state} ${dev_name}`);
                }
            });
        } catch (err) {
            this.log.error(`Error in hs_getRealtime ${ip_state} ${dev_name}`);
        }
    }

    async create_state() {
        this.log.debug(`create state`);
        const devices = this.config.devices;

        try {
            for (const k in devices) {
                const dev_ip = devices[k].ip;
                const dev_name = devices[k].name;
                if (devices[k].active) {
                    this.log.info(`Start with ${dev_ip} ${dev_name} `);
                    await this.cre_state(dev_ip, dev_name);
                }
            }

            this.setState('info.connection', true, true);
        } catch (err) {
            this.log.debug(`create state problem`);
        }
    }

    async ip_replace(ip) {
        const id_state = ip.replace(/[.\s]+/g, '_');
        return id_state;
    }

    async cre_state(ip, devName) {
        try {
            this.log.debug('create_state for IP : ' + ip);

            let hs_name;        
            
            const result = await client.getDevice({host: ip});

            if (result) {
                const hs_model = result.model;
                let hs_state = result.sysInfo.relay_state;

                const ip_state = await this.ip_replace(ip);

                hs_name = devName;

                if (hs_state == 0) {
                    hs_state = false;
                } else {
                    hs_state = true;
                }

                this.extendObjectAsync(`${ip_state}`, {
                    type: 'device',
                    common: {
                        name: hs_name || ip,
                    },
                    native: {},
                });

                this.extendObjectAsync(`${ip_state}.state`, {
                    type: 'state',
                    common: {
                        name: hs_name || ip,
                        type: 'boolean',
                        read: true,
                        write: true,
                        def: hs_state,
                        role: 'switch',
                        desc: 'Switch on/off'
                    },
                    native: {},
                });

                this.extendObjectAsync(`${ip_state}.last_update`, {
                    type: 'state',
                    common: {
                        name: hs_name || ip,
                        type: 'number',
                        read: true,
                        write: false,
                        role: 'value.time',
                        desc: 'last update'
                    },
                    native: {},
                });

                this.extendObjectAsync(`${ip_state}.mac`, {
                    type: 'state',
                    common: {
                        name: hs_name || ip,
                        type: 'string',
                        read: true,
                        write: false,
                        def: result.mac,
                        role: 'value',
                        desc: 'Mac address'
                    },
                    native: {},
                });

                this.extendObjectAsync(`${ip_state}.sw_ver`, {
                    type: 'state',
                    common: {
                        name: hs_name || ip,
                        type: 'string',
                        read: true,
                        write: false,
                        def: result.softwareVersion,
                        role: 'value',
                        desc: 'Software Version'
                    },
                    native: {},
                });

                this.extendObjectAsync(`${ip_state}.hw_ver`, {
                    type: 'state',
                    common: {
                        name: hs_name || ip,
                        type: 'string',
                        read: true,
                        write: false,
                        def: result.hardwareVersion,
                        role: 'value',
                        desc: 'Hardware Version'
                    },
                    native: {},
                });

                this.extendObjectAsync(`${ip_state}.model`, {
                    type: 'state',
                    common: {
                        name: hs_name || ip,
                        type: 'string',
                        read: true,
                        write: false,
                        def: hs_model,
                        role: 'value',
                        desc: 'Model'
                    },
                    native: {},
                });

                // plug HS110
                if (hs_model.search(/110/i) != -1 || hs_model.search(/115/i) != -1) {
                    this.extendObjectAsync(`${ip_state}.current`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'number',
                            read: true,
                            write: false,
                            def: 0,
                            role: 'value.current',
                            unit: `mA`,
                            desc: 'current value',
                        },
                        native: {},
                    });

                    this.extendObjectAsync(`${ip_state}.power`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'number',
                            read: true,
                            write: false,
                            unit: "W",
                            def: 0,
                            role: 'value',
                            desc: 'power value'
                        },
                        native: {},
                    });

                    this.extendObjectAsync(`${ip_state}.voltage`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'number',
                            read: true,
                            write: false,
                            def: 0,
                            role: 'value.voltage',
                            unit: 'V',
                            desc: 'voltage value'
                        },
                        native: {},
                    });
                    this.extendObjectAsync(`${ip_state}.ledState`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'boolean',
                            read: true,
                            write: false,
                            def: hs_state,
                            role: 'switch',
                            desc: 'Led on/off'
                        },
                        native: {},
                    });
                }
                // bulb LBxxx
                if (hs_model.search(/LB/i) != -1) {
                    this.extendObjectAsync(`${ip_state}.brightness`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'number',
                            read: true,
                            write: false,
                            def: 100,
                            role: 'value',
                            desc: 'brightness'
                        },
                        native: {},
                    });
                    this.extendObjectAsync(`${ip_state}.saturation`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'number',
                            read: true,
                            write: false,
                            def: 100,
                            role: 'value',
                            desc: 'saturation'
                        },
                        native: {},
                    });
                    this.extendObjectAsync(`${ip_state}.hue`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'number',
                            read: true,
                            write: false,
                            def: 0,
                            role: 'value',
                            desc: 'color'
                        },
                        native: {},
                    });
                    this.extendObjectAsync(`${ip_state}.color_temp`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'number',
                            read: true,
                            write: false,
                            def: 2700,
                            role: 'value',
                            desc: 'color_temp'
                        },
                        native: {},
                    });
                }

                if (hs_model.search(/LB/i) != -1 || hs_model.search(/110/i) != -1 || hs_model.search(/115/i) != -1) {

                    this.extendObjectAsync(`${ip_state}.totalNow`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'number',
                            read: true,
                            write: false,
                            def: 0,
                            role: 'value',
                            unit: 'kWh',
                            desc: 'total now value'
                        },
                        native: {},
                    });

                    this.extendObjectAsync(`${ip_state}.totalMonthNow`, {
                        type: 'state',
                        common: {
                            name: hs_name || ip,
                            type: 'number',
                            read: true,
                            write: false,
                            def: 0,
                            role: 'value',
                            unit: 'kWh',
                            desc: 'total month now value'
                        },
                        native: {},
                    });
                }
            }

            const ip_state = await this.ip_replace(ip);
            this.subscribeForeignStates(`${this.namespace}.${ip_state}.state`);

            this.log.debug(hs_model + ' generated ' + ip);

        } catch (error) {
            this.log.debug('State already present ' + ip);
        }
    }

    async initialization() {
        try {

            if (this.config.devices === undefined) {
                this.log.debug(`initialization undefined No one IP configured`);
                callback();
            }

            interval = parseInt(this.config.interval * 1000, 10);
            if (interval < 5000) {
                interval = 5000;
            }

        } catch (error) {
            this.log.error('initialization fail');
        }
    }


}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new hs100Controll(options);
} else {
    // otherwise start the instance directly
    new hs100Controll();
}
