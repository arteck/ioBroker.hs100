/**
 *
 *      ioBroker hs100 Adapter
 *
 *      (c) 2014-2017 arteck <arteck@outlook.com>
 *
 *      MIT License
 *
 */

'use strict';
const ioBrokerUtils = require(__dirname + '/lib/utils'); // Get common adapter utils
const adapter = ioBrokerUtils.adapter('hs100');
//const Hs100Api = require('./lib/Hs100Api');

const { Client } = require('./lib/tplink-smarthome-api/lib/index');
//const { Client } = require('c:\\Users\\keller\\AppData\\Roaming\\npm\\node_modules\\tplink-smarthome-api\\lib\\index');

const client = new Client();

var result;
var err;
var host  = '';
var plug;
var ip;
var timer     = null;
var stopTimer = null;
var isStopping = false;

adapter.on('ready', function () {
    main();
});

adapter.on('unload', function () {
    if (timer) {
        clearInterval(timer);
        timer = 0;
    }
    isStopping = true;
});

// Terminate adapter after 30 seconds idle
function stop() {
    if (stopTimer) clearTimeout(stopTimer);

    // Stop only if schedule mode
    if (adapter.common && adapter.common.mode == 'schedule') {
        stopTimer = setTimeout(function () {
            stopTimer = null;
            if (timer) clearInterval(timer);
            isStopping = true;
            adapter.stop();
        }, 30000);
    }
}


// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});


adapter.on('stateChange', function (id, state) {
    var tmp = id.split('.');
    var dp  = tmp.pop();
    var idx = tmp.pop();

    ip = idx.replace(/[_\s]+/g, '.');

   // create new plug with selected ip
    const plug = client.getDevice({host: ip}).then((device)=>{
        if (state && !state.ack) {
            if (dp == 'state') {
                device.setPowerState(state.val);
            }
        }
    });
});

process.on('SIGINT', function () {
    if (timer) clearTimeout(timer);
});


function createState(name, ip, callback) {
    var hs_sw_ver;
    var hs_hw_ver;
    var hs_model;
    var hs_mac;
    var hs_sysinfo;

// plug HS110
    var hs_current;
    var hs_power;
    var hs_total;
    var hs_ip;
    var hs_state;

    var id = ip.replace(/[.\s]+/g, '_');

    client.getDevice({host: ip}).then((result) => {
        if (result) {
            hs_model    = result.model;
            hs_state    = result.sysInfo.relay_state;

            if (hs_state == 0) {
                hs_state = false;
            } else {
                hs_state = true;
            }

            adapter.log.debug(hs_model + ' ' + ip + ' ' + hs_state);

            adapter.createState('', id, 'state', {
                name: name || ip,
                def: hs_state,
                type: 'boolean',
                read: 'true',
                write: 'true',
                role: 'switch',
                desc: 'Switch on/off'
            }, {
                ip: ip
            }, callback);

            adapter.createState('', id, 'mac', {
                name: name || ip,
                def: result.mac,
                type: 'string',
                read: 'true',
                write: 'true',
                role: 'value',
                desc: 'Mac address'
            }, {
                ip: ip
            }, callback);

            adapter.createState('', id, 'sw_ver', {
                name: name || ip,
                def: result.softwareVersion,
                type: 'string',
                read: 'true',
                write: 'true',
                role: 'value',
                desc: 'sw_ver'
            }, {
                ip: ip
            }, callback);

            adapter.createState('', id, 'hw_ver', {
                name: name || ip,
                def: result.hardwareVersion,
                type: 'string',
                read: 'true',
                write: 'true',
                role: 'value',
                desc: 'hw_ver'
            }, {
                ip: ip
            }, callback);

            adapter.createState('', id, 'model', {
                name: name || ip,
                def: hs_model,
                type: 'string',
                read: 'true',
                write: 'true',
                role: 'value',
                desc: 'model'
            }, {
                ip: ip
            }, callback);
        }

    // plug HS110
         if (hs_model.indexOf('110') > 1) {
             adapter.createState('', id, 'current', {
                 name: name || ip,
                 def: 0,
                 type: 'string',
                 read: 'true',
                 write: 'true',
                 role: 'value',
                 desc: 'current'
             }, {
                 ip: ip
             }, callback);
             adapter.createState('', id, 'power', {
                 name: name || ip,
                 def: 0,
                 type: 'string',
                 read: 'true',
                 write: 'true',
                 role: 'value',
                 desc: 'power'
             }, {
                 ip: ip
             }, callback);
             adapter.createState('', id, 'total', {
                 name: name || ip,
                 def: 0,
                 type: 'string',
                 read: 'true',
                 write: 'true',
                 role: 'value',
                 desc: 'total'
             }, {
                 ip: ip
             }, callback);
         }
    });
}

function addState(name, ip, room, callback) {
    adapter.getObject(host, function (err, obj) {
        createState(name, ip, callback);
    });
}

function syncConfig(callback) {
    adapter.getStatesOf('', host, function (err, _states) {
        var configToDelete = [];
        var configToAdd    = [];
        var k;
        var id;
        if (adapter.config.devices) {
            for (k = 0; k < adapter.config.devices.length; k++) {
                configToAdd.push(adapter.config.devices[k].ip);
            }
        }

        if (_states) {
            for (var j = 0; j < _states.length; j++) {
                var ip = _states[j].native.ip;
                if (!ip) {
                    adapter.log.warn('No IP address found for ' + JSON.stringify(_states[j]));
                    continue;
                }
                id = ip.replace(/[.\s]+/g, '_');
                var pos = configToAdd.indexOf(ip);
                if (pos != -1) {
                    configToAdd.splice(pos, 1);
                    // Check name and room
                    for (var u = 0; u < adapter.config.devices.length; u++) {
                        if (adapter.config.devices[u].ip == ip) {
                            if (_states[j].common.name != (adapter.config.devices[u].name || adapter.config.devices[u].ip)) {
                                adapter.extendObject(_states[j]._id, {common: {name: (adapter.config.devices[u].name || adapter.config.devices[u].ip)}});
                            }
                            if (adapter.config.devices[u].room) {
                                adapter.addStateToEnum('room', adapter.config.devices[u].room, '', host, id);
                            } else {
                                adapter.deleteStateFromEnum('room', '', host, id);
                            }
                        }
                    }
                } else {
                    configToDelete.push(ip);
                }
            }
        }

        if (configToAdd.length) {
            var count = 0;
            for (var r = 0; r < adapter.config.devices.length; r++) {
                if (configToAdd.indexOf(adapter.config.devices[r].ip) != -1) {
                    count++;
                    addState(adapter.config.devices[r].name, adapter.config.devices[r].ip, adapter.config.devices[r].room, function () {
                        if (!--count && callback) callback();
                    });
                }
            }
        }
        if (configToDelete.length) {
            for (var e = 0; e < configToDelete.length; e++) {
                id = configToDelete[e].replace(/[.\s]+/g, '_');
                adapter.deleteStateFromEnum('room', '',  host, id);
                adapter.deleteState('', host, id);
            }
        }
        if (!count && callback) callback();
    });
}

function getHS(hosts) {

    var hs_state;
    var hs_sw_ver;
    var hs_hw_ver;
    var hs_model;
    var hs_mac;

// plug HS110
    var hs_current;
    var hs_power;
    var hs_total;
    var hs_emeter

    if (stopTimer) clearTimeout(stopTimer);

    if (!hosts) {
        hosts = [];
        for (var i = 0; i < adapter.config.devices.length; i++) {
            hosts.push(adapter.config.devices[i].ip);
        }
    }

    if (!hosts.length) {
        timer = setTimeout(function () {
            getHS();
        }, adapter.config.interval);
        return;
    }

    var ip = hosts.pop();
    adapter.log.debug('HS Plug ' + ip);

    client.getDevice({host: ip}).then((result) => {
        if (result) {
            hs_mac    = result.mac;
            hs_sw_ver = result.softwareVersion;
            hs_hw_ver = result.hardwareVersion;
            hs_model  = result.model;
            hs_state  = result.sysInfo.relay_state;

            if (hs_state == 0) {
                hs_state = false;
            } else {
                hs_state = true;
            }

            adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.sw_ver'  , hs_sw_ver || 'undefined', true);
            adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.hw_ver'  , hs_hw_ver || 'undefined', true);
            adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.model'   , hs_model  || 'undefined', true);
            adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.mac'     , hs_mac    || 'undefined', true);
            adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.state'   , hs_state, true);

            adapter.log.debug('Aktualisierung der Daten für ' + ip + ' ' + hs_mac);

            if (hs_model.indexOf('110') > 1) {
                hs_emeter = result.emeterRealtime;

                if (typeof hs_emeter != "undefined") {
                    hs_current = hs_emeter.current;
                    hs_power = hs_emeter.power;
                    hs_total = hs_emeter.total;

                    adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.current', hs_current || '-1', true);
                    adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.power', hs_power || '-1', true);
                    adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.total', hs_total || '-1', true);

                    adapter.log.debug('Aktualisierung der Daten für HS110' + ip);
                }
            }

        }

        if (!isStopping) {
            setTimeout(function () {
                getHS(hosts);
            }, 0);
        }
    });
}

function main() {
    host = adapter.host;
    adapter.log.debug('Host = ' + host);

    if (!adapter.config.devices.length) {
        adapter.log.warn('No one IP configured');
        stop();
        return;
    }

    adapter.log.debug('Update alle ' + adapter.config.interval);
    adapter.config.interval = parseInt(adapter.config.interval, 10);

// pool min 5 sec.
    if (adapter.config.interval < 5000) {
        adapter.config.interval = 5000;
    }

    syncConfig(function () {
      getHS();
    });

    adapter.subscribeStates('*');
}
