/**
 *
 *      ioBroker hs100 Adapter
 *
 *      (c) 2014-2017 arteck<arteck@freenet.de>
 *
 *      MIT License
 *
 */

'use strict';
const ioBrokerUtils = require(__dirname + '/lib/utils'); // Get common adapter utils
const adapter = ioBrokerUtils.adapter('hs100');

const Hs100Api = require('./lib/Hs100Api');

var result;
var hosts;
var host  = '';
var plug;
var ip;
var hs_state;
var timer     = null;
var stopTimer = null;
var isStopping = false;

adapter.on('message', function (obj) {
    if (obj) processMessage(obj);
    processMessages();
});

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

function processMessage(obj) {
    if (!obj || !obj.command) return;
    switch (obj.command) {
        case 'hs100': {
            // Try to connect to mqtt broker
            if (obj.callback && obj.message) {
                ping.probe(obj.message, {log: adapter.log.debug}, function (err, result) {
                    adapter.sendTo(obj.from, obj.command, res, obj.callback);
                });
            }
            break;
        }
    }
}

function processMessages() {
    adapter.getMessage(function (err, obj) {
        if (obj) {
            processMessage(obj.command, obj.message);
            processMessages();
        }
    });
}

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
    var hs_state;

    var id = ip.replace(/[.\s]+/g, '_');

    if (room) {
        adapter.addStateToEnum('room', room, '', host, id);
    }

    plug = new Hs100Api({host: ip});

    plug.getSysInfo().then(function(result) {
        hs_state  = result.relay_state;

        if (hs_state == 0) {
            hs_state = false;
        } else {
            hs_state = true;
        }

//        adapter.log.warn(result.mac);

        adapter.createState('', id, 'state', {
            name:   name || ip,
            def:    hs_state,
            type:   'boolean',
            read:   'true',
            write:  'true',
            role:   'switch',
            desc:   'Switch on/off'
        }, {
            ip: ip
        }, callback);

        adapter.createState('', id, 'mac', {
            name:   name || ip,
            def:    result.mac,
            type:   'string',
            read:   'true',
            write:  'true',
            role:   'value',
            desc:   'Mac address'
        }, {
            ip: ip
        }, callback);

        adapter.createState('', id, 'sw_ver', {
            name:   name || ip,
            def:    result.sw_ver,
            type:   'string',
            read:   'true',
            write:  'true',
            role:   'value',
            desc:   'sw_ver'
        }, {
            ip: ip
        }, callback);

        adapter.createState('', id, 'hw_ver', {
            name:   name || ip,
            def:    result.hw_ver,
            type:   'string',
            read:   'true',
            write:  'true',
            role:   'value',
            desc:   'hw_ver'
        }, {
            ip: ip
        }, callback);

        adapter.createState('', id, 'model', {
            name:   name || ip,
            def:    result.model,
            type:   'string',
            read:   'true',
            write:  'true',
            role:   'value',
            desc:   'model'
        }, {
            ip: ip
        }, callback);
    }, function(err) {
        adapter.log.warn(err); // Error
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


var hs_sw_ver;
var hs_hw_ver;
var hs_model;
var hs_mac;

function switchAll() {
    if (!hosts) {
        hosts = [];
        for (var i = 0; i < adapter.config.devices.length; i++) {
            hosts.push(adapter.config.devices[i].ip);
            ip = hosts.pop();

            plug = new Hs100Api({host: ip});

            plug.getSysInfo().then(function(result) {
//                hs_state  = result.relay_state;
                hs_mac    = result.mac;
                hs_sw_ver = result.sw_ver;
                hs_hw_ver = result.hw_ver;
                hs_model  = result.model;
                
//                adapter.log.warn(hs_mac);
              
                adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.sw_ver', hs_sw_ver || '',    true);
                adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.hw_ver', hs_hw_ver || '',    true);
                adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.model',  hs_model || '',     true);
                adapter.setForeignState(adapter.namespace + '.' + ip.replace(/[.\s]+/g, '_') + '.mac',    hs_mac || '',       true);

            }, function(err) {
                adapter.log.warn(err);
            });
         //   adapter.setState({device: '', channel: ip.replace(/[.\s]+/g, '_') , state: 'state'},  {val: hs_state, ack: true});
       }
    }
}

function main() {
    host = adapter.host;

    syncConfig(function () {
      switchAll();
    });

    adapter.subscribeStates('*');
}
