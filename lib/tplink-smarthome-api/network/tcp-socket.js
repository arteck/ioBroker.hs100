"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const tplink_smarthome_crypto_1 = require("tplink-smarthome-crypto");
const tplink_socket_1 = __importDefault(require("./tplink-socket"));
const utils_1 = require("../utils");
/**
 * @hidden
 */
class TcpSocket extends tplink_socket_1.default {
    socketType = 'TCP';
    socket;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    logDebug(...args) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.log.debug(`[${this.socketId}] TcpSocket${args.shift()}`, ...args);
    }
    async createSocketImpl() {
        return new Promise((resolve) => {
            this.socket = new net_1.default.Socket();
            resolve(this.socket);
        });
    }
    close() {
        if (this.socket !== undefined)
            this.socket.end();
        super.close();
    }
    destroy(exception) {
        this.logDebug('#destroy(),', exception || '');
        if (this.socket === undefined)
            throw new Error('destroy called on without creating socket');
        this.socket.destroy(exception);
        this.isBound = false;
    }
    async sendAndGetResponse(payload, port, host, timeout) {
        return new Promise((resolve, reject) => {
            const { socket } = this;
            if (socket === undefined)
                throw new Error('send called without creating socket');
            let deviceDataBuf;
            let segmentCount = 0;
            let decryptedMsg;
            let timer;
            const setSocketTimeout = (socketTimeout) => {
                if (timer != null) {
                  clearTimeout(timer);
                }
                
                if (socketTimeout > 0) {
                    timer = setTimeout(() => {
                        this.logDebug(`: socketTimeout(${socketTimeout})`);
                        try {
                          this.destroy();
                        }
                        catch {
                            reject(new Error(`TCP Timeout`));
                        }
                    }, socketTimeout);
                }
            };
            setSocketTimeout(timeout);
            socket.removeAllListeners('data');
            socket.on('data', (data) => {
                try {
                    segmentCount += 1;
                    if (deviceDataBuf === undefined) {
                        deviceDataBuf = data;
                    }
                    else {
                        deviceDataBuf = Buffer.concat([deviceDataBuf, data], deviceDataBuf.length + data.length);
                    }
                    if (deviceDataBuf.length < 4) {
                        this.logDebug(`: socket:data: segment:${segmentCount} bufferLength:${deviceDataBuf.length} ...`);
                        return;
                    }
                    const expectedResponseLen = deviceDataBuf.slice(0, 4).readInt32BE();
                    const actualResponseLen = deviceDataBuf.length - 4;
                    if (actualResponseLen >= expectedResponseLen) {
                        decryptedMsg = (0, tplink_smarthome_crypto_1.decrypt)(deviceDataBuf.slice(4)).toString('utf8');
                        this.logDebug(`: socket:data: segment:${segmentCount} ${actualResponseLen}/${expectedResponseLen} [${(0, utils_1.replaceControlCharacters)(decryptedMsg)}]`);
                        socket.end();
                    }
                    else {
                        this.logDebug(`: socket:data: segment:${segmentCount} ${actualResponseLen}/${expectedResponseLen} ...`);
                    }
                }
                catch (err) {
                    this.logDebug(': socket:data error');
                    this.logDebug(data);
                    reject(err);
                }
            });
            socket.removeAllListeners('close');
            socket.once('close', (hadError) => {
                try {
                    this.logDebug(`: socket:close, hadError:${hadError}`);
                    setSocketTimeout(0);
                    this.isBound = false;
                    if (hadError || segmentCount === 0) {
                        throw new Error(`TCP Socket Closed. segment:${segmentCount} hadError:${hadError}`);
                    }
                    try {
                        resolve(decryptedMsg);
                    }
                    catch (err) {
                        this.log.error(`Error parsing JSON: From: [${socket.remoteAddress} ${socket.remotePort}] TCP segment:${segmentCount} data:%O decrypted:[${(0, utils_1.replaceControlCharacters)(decryptedMsg)}]`, deviceDataBuf);
                        throw err;
                    }
                }
                catch (err) {
                    this.logDebug(': socket:close error');
                    reject(err);
                }
            });
            socket.removeAllListeners('error');
            socket.on('error', (err) => {
                try {
                    this.logDebug(': socket:error', err);
                    setSocketTimeout(0);
                    this.destroy();
                }
                finally {
                    reject(err);
                }
            });
            const encryptedPayload = (0, tplink_smarthome_crypto_1.encryptWithHeader)(payload);
            this.logDebug(': socket:send payload.length', encryptedPayload.length);
            this.logDebug(`: socket:send attempting to connect. host:${host}, port:${port}`);
            socket.connect({ port, host }, () => {
                try {
                    this.logDebug(`: socket:connect ${socket.localAddress} ${socket.localPort} ${socket.remoteAddress} ${socket.remotePort}`);
                    this.isBound = true;
                    const writeRet = socket.write(encryptedPayload);
                    this.logDebug(': socket:connect:write', writeRet ? 'flushed' : 'queued');
                }
                catch (err) {
                    this.logDebug(': socket:connect error');
                    reject(err);
                }
            });
        });
    }
}
exports.default = TcpSocket;
//# sourceMappingURL=tcp-socket.js.map
