"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_clone_1 = __importDefault(require("lodash.clone"));
class Netif {
    device;
    apiModuleName;
    constructor(device, apiModuleName) {
        this.device = device;
        this.apiModuleName = apiModuleName;
    }
    /**
     * Requests `netif.get_scaninfo` (list of WiFi networks).
     *
     * Note that `timeoutInSeconds` is sent in the request and is not the actual network timeout.
     * The network timeout for the request is calculated by adding the
     * default network timeout to `timeoutInSeconds`.
     * @param  refresh - request device's cached results
     * @param  timeoutInSeconds - timeout for scan in seconds
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getScanInfo(refresh = false, timeoutInSeconds = 10, sendOptions) {
        const sendOptionsWithTimeout = (0, lodash_clone_1.default)(sendOptions || {});
        if (sendOptionsWithTimeout.timeout == null) {
            sendOptionsWithTimeout.timeout =
                timeoutInSeconds * 1000 * 2 +
                    (this.device.defaultSendOptions.timeout || 5000);
        }
        return this.device.sendCommand({
            [this.apiModuleName]: {
                get_scaninfo: {
                    refresh: refresh ? 1 : 0,
                    timeout: timeoutInSeconds,
                },
            },
        }, undefined, sendOptions);
    }
}
exports.default = Netif;
//# sourceMappingURL=netif.js.map