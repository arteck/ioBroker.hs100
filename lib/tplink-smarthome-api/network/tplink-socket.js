"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_queue_1 = __importDefault(require("promise-queue"));
/**
 * @hidden
 */
class TplinkSocket {
    socketId;
    log;
    isBound = false;
    queue = new promise_queue_1.default(1, Infinity);
    constructor(socketId, log) {
        this.socketId = socketId;
        this.log = log;
    }
    async createSocket() {
        this.log.debug(`[${this.socketId}] TplinkSocket(${this.socketType}).createSocket()`);
        if (this.socket) {
            throw new Error('Socket Already Created');
        }
        try {
            this.socket = await this.createSocketImpl();
            return this.socket;
        }
        catch (err) {
            this.log.error(`${this.socketType} Error (createSocket): %s`, err);
            this.isBound = false;
            throw err;
        }
    }
    async send(payload, port, host, { timeout }) {
        this.log.debug(`[${this.socketId}] TplinkSocket(${this.socketType}).send(%j)`, { payload, port, host, timeout });
        return this.queue
            .add(async () => {
            try {
                return await this.sendAndGetResponse(payload, port, host, timeout);
            }
            catch (err) {
                this.log.debug(`[${this.socketId}] TplinkSocket(${this.socketType}).send()`, err);
                if (this.isBound)
                    this.close();
                throw err;
            }
        })
            .catch((err) => {
            throw err;
        });
    }
    close() {
        this.log.debug(`[${this.socketId}] TplinkSocket(${this.socketType}).close()`);
        this.isBound = false;
    }
    unref() {
        if (this.socket === undefined)
            throw new Error('unref called without creating socket');
        return this.socket.unref();
    }
}
exports.default = TplinkSocket;
//# sourceMappingURL=tplink-socket.js.map