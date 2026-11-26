"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dgram_1 = __importDefault(require("dgram"));
const tplink_smarthome_crypto_1 = require("tplink-smarthome-crypto");
const utils_1 = require("../utils");
const tplink_socket_1 = __importDefault(require("./tplink-socket"));
/**
 * @hidden
 */
class UdpSocket extends tplink_socket_1.default {
    socketType = 'UDP';
    socket;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logDebug(...args) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.log.debug(`[${this.socketId}] UdpSocket${args.shift()}`, ...args);
    }
    async createSocketImpl() {
        return new Promise((resolve, reject) => {
            const socket = dgram_1.default.createSocket('udp4');
            this.socket = socket;
            this.socket.on('error', (err) => {
                this.logDebug(': createSocket:error');
                reject(err);
            });
            this.socket.bind(() => {
                this.logDebug('.createSocket(): listening on %j', socket.address());
                socket.removeAllListeners('error'); // remove listener so promise can't be resolved & rejected
                this.isBound = true;
                resolve(socket);
            });
        });
    }
    close() {
        if (this.socket !== undefined)
            this.socket.close();
        super.close();
    }
    async sendAndGetResponse(payload, port, host, timeout) {
        return new Promise((resolve, reject) => {
            const { socket } = this;
            if (socket === undefined)
                throw new Error('send called without creating socket');
            let timer;
            const setSocketTimeout = (socketTimeout) => {
                if (timer != null)
                    clearTimeout(timer);
                if (socketTimeout > 0) {
                    timer = setTimeout(() => {
                        this.logDebug(`: socketTimeout(${socketTimeout})`);
                        reject(new Error(`UDP Timeout after ${socketTimeout}ms\n${host}:${port} ${payload}`));
                    }, socketTimeout);
                }
            };
            setSocketTimeout(timeout);
            socket.removeAllListeners('message');
            socket.removeAllListeners('close');
            socket.removeAllListeners('error');
            socket.on('message', (msg, rinfo) => {
                let decryptedMsg = '';
                try {
                    this.logDebug(': socket:data rinfo: %j', rinfo);
                    setSocketTimeout(0);
                    decryptedMsg = (0, tplink_smarthome_crypto_1.decrypt)(msg).toString('utf8');
                    this.logDebug(`: socket:data message:${(0, utils_1.replaceControlCharacters)(decryptedMsg)}`);
                    resolve(decryptedMsg);
                }
                catch (err) {
                    this.log.error(`Error processing UDP message: From:[%j] SO_RCVBUF:[%d]${'\n'}  msg:[%o]${'\n'}  decrypted:[${(0, utils_1.replaceControlCharacters)(decryptedMsg)}]`, rinfo, socket.getRecvBufferSize(), msg);
                    reject(err);
                }
            });
            socket.on('close', () => {
                try {
                    this.logDebug(': socket:close');
                    setSocketTimeout(0);
                }
                finally {
                    reject(new Error('UDP Socket Closed'));
                }
            });
            socket.on('error', (err) => {
                this.logDebug(': socket:error');
                setSocketTimeout(0);
                reject(err);
            });
            const encryptedPayload = (0, tplink_smarthome_crypto_1.encrypt)(payload);
            this.logDebug(': socket:send payload.length', encryptedPayload.length);
            socket.send(encryptedPayload, 0, encryptedPayload.length, port, host, (err) => {
                if (err) {
                    try {
                        this.logDebug(`: socket:send socket:error length: ${encryptedPayload.length} SO_SNDBUF:${socket.getSendBufferSize()} `, err);
                        if (this.isBound)
                            this.close();
                    }
                    finally {
                        reject(err);
                    }
                    return;
                }
                this.logDebug(': socket:send sent');
            });
        });
    }
}
exports.default = UdpSocket;
//# sourceMappingURL=udp-socket.js.map