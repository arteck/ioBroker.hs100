"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tplink_connection_1 = __importDefault(require("./tplink-connection"));
const udp_socket_1 = __importDefault(require("./udp-socket"));
/**
 * @hidden
 */
class UdpConnection extends tplink_connection_1.default {
    sharedSocket;
    socketType = 'UDP';
    timeout;
    async getSocket(useSharedSocket) {
        this.log.debug(`UdpConnection(${this.description}).getSocket(%j)`, {
            useSharedSocket,
        });
        if (useSharedSocket && this.sharedSocket !== undefined) {
            this.log.debug(`UdpConnection(${this.description}).getSocket(): reusing shared socket`);
            if (this.sharedSocket.socket != null && this.sharedSocket.isBound) {
                return this.sharedSocket;
            }
            this.log.debug(`UdpConnection(${this.description}).getSocket(): recreating shared socket`);
        }
        const socket = new udp_socket_1.default(this.client.getNextSocketId(), this.log);
        await socket.createSocket();
        if (useSharedSocket) {
            socket.unref(); // let node exit cleanly if socket is left open
            this.sharedSocket = socket;
        }
        return socket;
    }
    setTimeout(timeout) {
        if (this.timeout !== undefined) {
            clearTimeout(this.timeout);
        }
        if (timeout > 0) {
            this.timeout = setTimeout(() => {
                this.emit('timeout');
            }, timeout);
        }
    }
    async send(payload, port, host, { timeout, useSharedSocket, sharedSocketTimeout, }) {
        if (useSharedSocket) {
            this.setTimeout(sharedSocketTimeout);
        }
        const response = await super.send(payload, port, host, {
            timeout,
            useSharedSocket,
            sharedSocketTimeout,
        });
        return response;
    }
    close() {
        super.close();
        this.setTimeout(0);
        if (this.sharedSocket && this.sharedSocket.isBound) {
            this.log.debug(`UdpConnection(${this.description}).close() closing shared socket`);
            this.sharedSocket.close();
        }
    }
}
exports.default = UdpConnection;
//# sourceMappingURL=udp-connection.js.map