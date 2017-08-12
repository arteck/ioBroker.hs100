'use strict';

const net = require('net');
const encryptWithHeader = require('./hs100').encryptWithHeader;
const decrypt = require('./hs100').decrypt;
const decrypt2 = require('./hs100').decrypt2;
const encrypt = require('./hs100').encrypt;

const dgram = require('dgram');
var client = dgram.createSocket('udp4');



const commands = {
    setPowerStateOn: '{"system":{"set_relay_state":{"state":1}}}',
    setPowerStateOff: '{"system":{"set_relay_state":{"state":0}}}',
    getSysInfo:  '{"system":{"get_sysinfo":{}}}',
    getConsumption: '{"emeter":{"get_realtime":{}}}'
};

class Hs100Api {

    constructor(config) {
        if (typeof config === 'undefined') config = {};
        this.host = config.host;
        this.port = config.port || 9999;
    }

    getSysInfo() {
        return new Promise((resolve, reject) => {
            const socket = this.send(commands.getSysInfo);

            socket.on('data', function (data) {
                data = decrypt2(data).toString('ascii');
                data = JSON.parse(data);
                socket.end();
//                resolve(data.system.get_sysinfo);
                resolve(data);
            }).on('error', (err) => {
                socket.end();
                reject(err);
            });
        });
    }

    getConsumption() {
        return new Promise((resolve, reject) => {
            const socket = this.send(commands.getConsumption);

            socket.on('data', function (data) {
                data = decrypt2(data).toString('ascii');
                data = JSON.parse(data);
                socket.end();
//                resolve(data.emeter.get_realtime);
                resolve(data);
            }).on('error', (err) => {
                socket.end();
                reject(err);
            });
        });
    }

    setPowerState(value) {
        return new Promise((resolve, reject) => {
            const cmd = (value ? commands.setPowerStateOn : commands.setPowerStateOff);
            const socket = this.send(cmd);
            socket.on('data', () => {
                socket.end();
                resolve();
            }).on('error', (err) => {
                socket.end();
                reject(err);
            });
        });
    }


    send(payload) {
        const socket = net.connect(this.port, this.host);
        socket.setKeepAlive(false);

        socket.on('connect', () => {
            socket.write(encryptWithHeader(payload));
        });
        socket.on('timeout', () => {
            socket.end();
        });
        socket.on('end', () => {
            socket.end();
        });
        socket.on('error', () => {
            socket.end();
        });

        return socket;
    }

}

module.exports = Hs100Api;