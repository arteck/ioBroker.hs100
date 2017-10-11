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

const Hs100Api = require('./lib/Hs100Api');

var result;
var result2;
var err;
var err2;
var host  = '';
var plug;
var ip;
var hs_state;
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
     plug = new Hs100Api({host: ip});

     if (state && !state.ack) {
        if (dp == 'state') {
           plug.setPowerState(state.val);
        }
     }
});

function createState(name, ip, room, callback) {
    var hs_sw_ver;
    var hs_hw_ver;
    var hs_model;
    var hs_mac;

// plug HS110
    var hs_current;
    var hs_power;
    var hs_total;

    var hs_state;

    var id = ip.replace(/[.\s]+/g, '_');

    if (room) {
        adapter.addStateToEnum('room', room, '', host, id);
    }

    plug = new Hs100Api({host: ip});

    plug.getSysInfo().then(function(result) {
        if (result) {
            hs_state = result.system.get_sysinfo.relay_state;
            hs_model = result.system.get_sysinfo.model;

            if (hs_state == 0) {
                hs_state = false;
            } else {
                hs_state = true;
            }

            adapter.log.debug(result.mac);

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
                def: result.system.get_sysinfo.mac,
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
                def: result.system.get_sysinfo.sw_ver,
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
                def: result.system.get_sysinfo.hw_ver,
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
      //       plug.getConsumption().then(function (result2) {
      //           if (result2) {
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
          //       }
        //     });
         }
    });
}

function addState(name, ip, room, callback) {
    adapter.getObject(host, function (err, obj) {
        if (err || !obj) {
            // if root does not exist, channel will not be created
            adapter.createChannel('', host.replace(/[.\s]+/g, '_'), [], function () {
                createState(name, ip, room, callback);
            });
        } else {
            createState(name, ip, room, callback);
        }
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
    var hs_sw_ver;
    var hs_hw_ver;
    var hs_model;
    var hs_mac;

// plug HS110
    var hs_current;
    var hs_power;
    var hs_total;


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

    ip = hosts.pop();

    adapter.log.debug('HS Plug ' + ip);

    plug = new Hs100Api({host: ip});

    plug.getSysInfo().then(function(result) {
        if (result) {
            hs_mac    = result.system.get_sysinfo.mac;
            hs_sw_ver = result.system.get_sysinfo.sw_ver;
            hs_hw_ver = result.system.get_sysinfo.hw_ver;
            hs_model  = result.system.get_sysinfo.model;

            adapter.log.debug(hs_mac);
 
            adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.sw_ver', hs_sw_ver || '', true);
            adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.hw_ver', hs_hw_ver || '', true);
            adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.model' , hs_model  || '', true);
            adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.mac'   , hs_mac    || '', true);

            if (hs_model) {
                if (hs_model.indexOf('110') > 1) {
                    plug.getConsumption().then(function (result2) {
                        if (result2) {
                            if (result2.emeter.err_code < 0) {
                                adapter.log.debug(result2.emeter.err_msg);
                            } else {
                                hs_current = result2.emeter.get_realtime.current;
                                hs_power = result2.emeter.get_realtime.power;
                                hs_total = result2.emeter.get_realtime.total;

                                adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.current', hs_current || '', true);
                                adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.power', hs_power || '', true);
                                adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.total', hs_total || '', true);
                            }
                        }
                    });
                }
            }
        }
    });
 
    if (!isStopping) {
        setTimeout(function () {
            getHS(hosts);
        }, 0);
    }
}

function main() {
    host = adapter.host;
    adapter.log.debug('Host=' + host);

    if (!adapter.config.devices.length) {
        adapter.log.warn('No one IP configured');
        stop();
        return;
    }

// pool min 5 sec.
    if (adapter.config.interval < 5000) {
        adapter.config.interval = 5000;
    }

    syncConfig(function () {
      getHS();
    });

    adapter.subscribeStates('*');
}
