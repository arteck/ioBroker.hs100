"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const promise_queue_1 = __importDefault(require("promise-queue"));
/**
 * @hidden
 */
class TplinkConnection extends events_1.EventEmitter {
    host;
    port;
    log;
    client;
    // TODO: Move queue to device, so UDP and TCP connections share a queue
    queue = new promise_queue_1.default(1, Infinity);
    constructor(host, port, log, client) {
        super();
        this.host = host;
        this.port = port;
        this.log = log;
        this.client = client;
        this.on('timeout', () => {
            this.log.debug(`TplinkConnection(${this.description}): timeout()`, this.host, this.port);
            this.queue
                .add(() => {
                this.close();
                return Promise.resolve();
            })
                .catch((err) => {
                this.log.debug(`TplinkConnection(${this.description}): timeout.close()`, err);
            });
        });
    }
    get description() {
        return `${this.socketType} ${this.host}:${this.port}`;
    }
    async send(payload, port, host, { timeout, useSharedSocket, sharedSocketTimeout, }) {
        this.log.debug(`TplinkConnection(${this.description}).send(%j)`, {
            payload,
            timeout,
            useSharedSocket,
            sharedSocketTimeout,
        });
        // Allow redefining post/host on each send in case device IP has changed
        this.port = port;
        this.host = host;
        let socket;
        return this.queue.add(async () => {
            try {
                socket = await this.getSocket(useSharedSocket);
                const response = await socket.send(payload, this.port, this.host, {
                    timeout,
                });
                if (!useSharedSocket) {
                    socket.close();
                }
                return response;
            }
            catch (err) {
                this.log.error(`${this.description} %s`, err);
                if (socket && socket.isBound)
                    socket.close();
                throw err;
            }
        });
    }
    close() {
        this.log.debug(`TplinkConnection(${this.description}).close()`);
    }
}
exports.default = TplinkConnection;
//# sourceMappingURL=tplink-connection.js.map