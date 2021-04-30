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
const { Client } = require('tplink-smarthome-api');
const client = new Client();
const MAX_POWER_VALUE = 10 * 1000; // max value for power consumption: 10 kW

let requestTimeout = null;

let interval = 0;

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
            if (requestTimeout) clearTimeout(requestTimeout);

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
                this.log.debug(`stateID ${id} changed: ${state.val} (ack = ${state.ack})`);

                // The state was changed

                let tmp = id.split('.');
                let dp  = tmp.pop();

                let idx = tmp.pop();
                let ip = idx.replace(/[_\s]+/g, '.');

                this.setDevice(id, dp, state, ip);


            } else {
                // The state was deleted
                this.log.info(`state ${id} deleted`);

            }

    }


    async setDevice(id, dp, state, ip) {
    try {
        const device = await client.getDevice({host: ip, timeout: 5000});

        if (device.model.search(/LB/i) != -1) {
            let lightstate = device.sysInfo.light_state;

            if (state.ack != null) {
                if (state && !state.ack) {
                    if (dp == 'state') {
                        device.setPowerState(state.val).catch(err => {
                            this.log.warn('setPowerState Socket connection Timeout : ' +  ip );
                        });
                    } else {
                        findAndReplace(lightstate, dp , state.val);
                        device.lighting.setLightState(lightstate).catch(err => {
                            this.log.warn('setLightState Socket connection Timeout : ' +  ip );
                        });
                    }
                }
            }
        } else {
            if (state && !state.ack) {
                if (dp == 'state') {
                    device.setPowerState(state.val).catch(err => {
                        this.log.warn('LB setPowerState Socket connection Timeout : ' +  ip );
                    });
                } else {
                    if (dp == 'ledState') {
                        device.setLedState(state.val).catch(err => {
                            this.log.warn('LB setLedState Socket connection Timeout : ' +  ip );
                        });
                    }
                }
            }
        }

      } catch (error) {
            this.log.warn(`Info Message setDevice: ${error.stack}`);

      }

    }

    async getInfos() {
        this.log.debug(`get Information`);
        
        let devices = this.config.devices;
        
        try {
            for (const k in devices) {
                if (devices[k].active) {
                    const ip = devices[k].ip;
                    this.updateDevice(ip);
                }
            }
            requestTimeout = setTimeout(async () => {
                this.getInfos();
            }, interval);
        } catch (err) {
          this.log.error('getInfosError ' + JSON.stringify(err));
        }
    }

    async updateDevice(ip) {

        let hs_state;
        let hs_sw_ver;
        let hs_hw_ver;
        let hs_model;
        let hs_mac;
        let hs_lastupdate;

    // plug HS110
        let hs_current;
        let hs_power;
        let hs_total;
        let hs_voltage;
        let hs_emeter;
        let hs_led;

    // bulb lb
        let lb_bright;
        let lb_color_temp;
        let lb_hue;
        let lb_saturation;

    // bulb KL60
        let kl_bright;


    try {
        const result = await client.getDevice({host: ip, timeout: 5000});

        if (result) {
                const ip_state = ip.replace(/[.\s]+/g, '_');
                let  jetzt = new Date();
                let hh =  jetzt.getHours();
                let mm =  jetzt.getMinutes();
                let ss =  jetzt.getSeconds();
                let jahr  = jetzt.getFullYear();
                let monat = jetzt.getMonth()+1;  // von 0 - 11 also +1
                let tag   = jetzt.getDate();

                if(hh < 10){hh = '0'+ hh;}
                if(mm < 10){mm = '0'+ mm;}
                if(ss < 10){ss = '0'+ ss;}

                hs_lastupdate = jahr + '.' + monat + '.' + tag + ' ' + hh + ':' + mm + ':' + ss;

                hs_mac    = result.mac;
                hs_sw_ver = result.softwareVersion;
                hs_hw_ver = result.hardwareVersion;
                hs_model  = result.model;

                if (hs_model.search(/LB/i) != -1) {
                    hs_state = result.sysInfo.light_state.on_off;
                } else {
                    hs_state = result.sysInfo.relay_state;
                }

                if (hs_state == 0) {
                    hs_state = false;
                } else {
                    hs_state = true;
                }

                this.setForeignState(`${this.namespace}.${ip_state}.sw_ver`  , hs_sw_ver || 'undefined', true);
                this.setForeignState(`${this.namespace}.${ip_state}.hw_ver`  , hs_hw_ver || 'undefined', true);
                this.setForeignState(`${this.namespace}.${ip_state}.model`   , hs_model  || 'undefined', true);
                this.setForeignState(`${this.namespace}.${ip_state}.mac`     , hs_mac    || 'undefined', true);
                this.setForeignState(`${this.namespace}.${ip_state}.state`   , hs_state, true);

                this.setState(`${this.namespace}.${ip_state}.last_update`, hs_lastupdate || '-1', true);

                this.log.debug('Refresh ' + ip + ' Model = '+ result.model + ' state = ' + hs_state + ' update = ' + hs_lastupdate);

                if (hs_model.search(/110/i) != -1) {

                    try {
                      result.emeter.getRealtime().then((resultRealtime) => {
                          if (typeof resultRealtime != "undefined") {
                              if (hs_hw_ver == "2.0"
                                  ||  hs_hw_ver == "3.0") {
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
                                  hs_power = resultRealtime.power;
                                  hs_total = resultRealtime.total;
                                  hs_voltage = Math.ceil(resultRealtime.voltage);
                              }

                              if (result.sysInfo.led_off == 0) {
                                  hs_led  = true;
                              } else {
                                  hs_led  = false;
                              }

                              this.setForeignState(`${this.namespace}.${ip_state}.current`  , parseFloat(hs_current) || 0, true);

                              if(hs_power < MAX_POWER_VALUE) {
                                  this.setForeignState(`${this.namespace}.${ip_state}.power` , parseFloat(hs_power) || 0, true);
                              }

                              this.setForeignState(`${this.namespace}.${ip_state}.voltage`  , parseFloat(hs_voltage) || 0, true);
                              this.setForeignState(`${this.namespace}.${ip_state}.ledState`  , hs_led.toString() || 'false', true);
                              this.log.debug('Refresh Data HS110 ' + ip);
                          }
                      });
                   } catch(err) {
                      this.log.error('result.emeter.getRealtime ip: ' +  ip );
                   }
                }

                if (hs_model.search(/LB/i) != -1 || hs_model.search(/110/i) != -1) {
                  try {
                    result.emeter.getMonthStats(jahr).then((resultMonthStats) => {
                        let mothList = resultMonthStats.month_list;
                        let energy_v = 0;
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
                        this.setForeignState(`${this.namespace}.${ip_state}.totalMonthNow`  , parseFloat(energy_v) || 0, true);
                        this.log.debug('Month value Model : '  + hs_model + ' IP : ' + ip);
                    });
                 } catch(err) {
                    this.log.error('result.emeter.getMonthStats ip: ' +  ip );
                 }

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
                        this.setForeignState(`${this.namespace}.${ip_state}.totalNow`  , parseFloat(energy_v) || 0, true);
                        this.log.debug('Day value for Model : ' + hs_model + ' Energy : ' + energy_v + ' IP : ' + ip);
                    });
                 } catch(err) {
                    this.log.error('result.emeter.getDayStats ip: ' +  ip );
                 }
                }
                // Bulb
                if (hs_model.search(/LB/i) != -1) {
                    if (result.sysInfo.is_dimmable == 1) {

                        this.log.warn('result lb110 --->>>> : ' +  JSON.stringify(result));

                        let devLight = result.lighting.getLightState();
                        lb_bright     = result.sysInfo.light_state.brightness;
                        lb_color_temp = result.sysInfo.light_state.color_temp;
                        lb_hue        = result.sysInfo.light_state.hue;
                        lb_saturation = result.sysInfo.light_state.saturation;
                        this.setForeignState(this.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.brightness'   , lb_bright, true);
                        this.setForeignState(this.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.color_temp'   , lb_color_temp, true);
                        this.setForeignState(this.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.hue'   , lb_hue, true);
                        this.setForeignState(this.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.saturation'   , lb_saturation, true);
                    }
                }
                if (hs_model.search(/KL/i) != -1){
                    kl_bright = result.sysInfo.light_state.brightness;
                    this.setForeignState(this.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.brightness'   , kl_bright, true);
                }
            }
        } catch(err) {
            this.log.warn('getDevice Socket connection Timeout ip: ' +  ip + ' please reconnect the Device');

        }
    }
    async create_state() {

      let ip;

      this.log.debug(`create state`);
      let devices = this.config.devices;
      try {
        for (const k in devices) {
            ip = devices[k].ip;

            if (devices[k].active) {
              this.log.info ('Start with IP : ' + ip );
              await this.cre_state(ip, devices[k].name);
            }
        }

        this.setState('info.connection', true, true);
      } catch (err) {
          this.log.debug(`create state problem`);
      }
    }


    async cre_state(ip, devName) {
        try {
            const result = await client.getDevice({host: ip});

            this.log.debug ('create_state for IP : ' + ip );

            let ip_state;
            let hs_model;
            let hs_sw_ver;
            let hs_hw_ver;
            let hs_mac;
            let hs_sysinfo;
            let hs_name;

            // plug HS100
            let hs_current;
            let hs_power;
            let hs_total;

            if (result) {
              hs_model = result.model;
              let hs_state = result.sysInfo.relay_state;

              ip_state = ip.replace(/[.\s]+/g, '_');

              hs_name = devName;

              if (hs_state == 0) {
                  hs_state = false;
              } else {
                  hs_state = true;
              }

              this.extendObjectAsync(`${ip_state}`, {
                  type: 'channel',
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
                      type: 'string',
                      read: true,
                      write: false,
                      def: -1,
                      role: 'value',
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
              if (hs_model.search(/110/i) != -1) {
                  this.extendObjectAsync(`${ip_state}.current`, {
                      type: 'state',
                      common: {
                          name: hs_name || ip,
                          type: 'float',
                          read: true,
                          write: false,
                          def: 0,
                          role: 'value.current',
                          unit:`A`,
                          desc: 'current value',
                      },
                      native: {},
                  });

                  this.extendObjectAsync(`${ip_state}.power`, {
                      type: 'state',
                      common: {
                          name: hs_name || ip,
                          type: 'float',
                          read: true,
                          write: false,
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
                          type: 'string',
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
                          type: 'string',
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
                          type: 'string',
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
                          type: 'string',
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
                          type: 'string',
                          read: true,
                          write: false,
                          def: 2700,
                          role: 'value',
                          desc: 'color_temp'
                      },
                      native: {},
                  });
              }

              if (hs_model.search(/LB/i) != -1 || hs_model.search(/110/i) != -1) {

                  this.extendObjectAsync(`${ip_state}.totalNow`, {
                      type: 'state',
                      common: {
                          name: hs_name || ip,
                          type: 'float',
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
                          type: 'float',
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


            this.subscribeForeignStates(`${this.namespace}.${ip_state}.state`);

            this.log.debug(hs_model + ' generated ' + ip);

        } catch (error) {
            this.log.debug('State already present ' + ip);
        }
    }
    async initialization() {
        try {

            if (this.config.devices === undefined ) {
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
