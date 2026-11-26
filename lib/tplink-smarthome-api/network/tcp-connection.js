"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tplink_connection_1 = __importDefault(require("./tplink-connection"));
const tcp_socket_1 = __importDefault(require("./tcp-socket"));
/**
 * @hidden
 */
class TcpConnection extends tplink_connection_1.default {
    socketType = 'TCP';
    async getSocket() {
        this.log.debug(`TcpConnection(${this.description}).getSocket()`);
        const socket = new tcp_socket_1.default(this.client.getNextSocketId(), this.log);
        await socket.createSocket();
        return socket;
    }
    async send(payload, port, host, { timeout }) {
        return super.send(payload, port, host, { timeout });
    }
}
exports.default = TcpConnection;
//# sourceMappingURL=tcp-connection.js.map