"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Time {
    device;
    apiModuleName;
    constructor(device, apiModuleName) {
        this.device = device;
        this.apiModuleName = apiModuleName;
    }
    /**
     * Gets device's time.
     *
     * Requests `timesetting.get_time`. Does not support ChildId.
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getTime(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { get_time: {} },
        }, undefined, sendOptions);
    }
    /**
     * Gets device's timezone.
     *
     * Requests `timesetting.get_timezone`. Does not support ChildId.
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getTimezone(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { get_timezone: {} },
        }, undefined, sendOptions);
    }
}
exports.default = Time;
//# sourceMappingURL=time.js.map