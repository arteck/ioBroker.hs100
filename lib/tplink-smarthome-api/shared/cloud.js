"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCloudInfo = void 0;
const utils_1 = require("../utils");
function isCloudInfo(candidate) {
    return (0, utils_1.isObjectLike)(candidate);
}
exports.isCloudInfo = isCloudInfo;
class Cloud {
    device;
    apiModuleName;
    info;
    constructor(device, apiModuleName) {
        this.device = device;
        this.apiModuleName = apiModuleName;
    }
    /**
     * Gets device's TP-Link cloud info.
     *
     * Requests `cloud.get_info`. Does not support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getInfo(sendOptions) {
        this.info = (0, utils_1.extractResponse)(await this.device.sendCommand({
            [this.apiModuleName]: { get_info: {} },
        }, undefined, sendOptions), '', (c) => isCloudInfo(c) && (0, utils_1.hasErrCode)(c));
        return this.info;
    }
    /**
     * Add device to TP-Link cloud.
     *
     * Sends `cloud.bind` command. Does not support childId.
     * @param   username
     * @param   password
     * @param   sendOptions
     * @returns parsed JSON response
     */
    async bind(username, password, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { bind: { username, password } },
        }, undefined, sendOptions);
    }
    /**
     * Remove device from TP-Link cloud.
     *
     * Sends `cloud.unbind` command. Does not support childId.
     * @param   sendOptions
     * @returns parsed JSON response
     */
    async unbind(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { unbind: {} },
        }, undefined, sendOptions);
    }
    /**
     * Get device's TP-Link cloud firmware list.
     *
     * Sends `cloud.get_intl_fw_list` command. Does not support childId.
     * @param   sendOptions
     * @returns parsed JSON response
     */
    async getFirmwareList(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { get_intl_fw_list: {} },
        }, undefined, sendOptions);
    }
    /**
     * Sets device's TP-Link cloud server URL.
     *
     * Sends `cloud.set_server_url` command. Does not support childId.
     * @param   server - URL
     * @param   sendOptions
     * @returns parsed JSON response
     */
    async setServerUrl(server, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { set_server_url: { server } },
        }, undefined, sendOptions);
    }
}
exports.default = Cloud;
//# sourceMappingURL=cloud.js.map