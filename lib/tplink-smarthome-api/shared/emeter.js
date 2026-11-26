"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRealtime = void 0;
const utils_1 = require("../utils");
function isRealtime(candidate) {
    return (0, utils_1.isObjectLike)(candidate);
}
exports.isRealtime = isRealtime;
class Emeter {
    device;
    apiModuleName;
    childId;
    #realtime = {};
    constructor(device, apiModuleName, childId = undefined) {
        this.device = device;
        this.apiModuleName = apiModuleName;
        this.childId = childId;
    }
    /**
     * Returns cached results from last retrieval of `emeter.get_realtime`.
     * @returns {Object}
     */
    get realtime() {
        return this.#realtime;
    }
    /**
     * @private
     */
    setRealtime(realtime) {
        const normRealtime = { ...realtime }; // will coerce null/undefined to {}
        const normalize = (key1, key2, multiplier) => {
            const r = normRealtime;
            if (typeof r[key1] === 'number' && r[key2] === undefined) {
                r[key2] = Math.floor(r[key1] * multiplier);
            }
            else if (r[key1] == null && typeof r[key2] === 'number') {
                r[key1] = r[key2] / multiplier;
            }
        };
        normalize('current', 'current_ma', 1000);
        normalize('power', 'power_mw', 1000);
        normalize('total', 'total_wh', 1000);
        normalize('voltage', 'voltage_mv', 1000);
        this.#realtime = normRealtime;
        // @ts-expect-error typescript limitation
        this.device.emit('emeter-realtime-update', this.#realtime);
    }
    /**
     * Gets device's current energy stats.
     *
     * Requests `emeter.get_realtime`. Older devices return `current`, `voltage`, etc,
     * while newer devices return `current_ma`, `voltage_mv` etc
     * This will return a normalized response including both old and new style properties for backwards compatibility.
     * Supports childId.
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getRealtime(sendOptions) {
        this.setRealtime((0, utils_1.extractResponse)(await this.device.sendCommand({
            [this.apiModuleName]: { get_realtime: {} },
        }, this.childId, sendOptions), '', (c) => isRealtime(c) && (0, utils_1.hasErrCode)(c)));
        return this.realtime;
    }
    /**
     * Get Daily Emeter Statistics.
     *
     * Sends `emeter.get_daystat` command. Supports childId.
     * @param   year
     * @param   month
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getDayStats(year, month, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { get_daystat: { year, month } },
        }, this.childId, sendOptions);
    }
    /**
     * Get Monthly Emeter Statistics.
     *
     * Sends `emeter.get_monthstat` command. Supports childId.
     * @param   year
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getMonthStats(year, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { get_monthstat: { year } },
        }, this.childId, sendOptions);
    }
    /**
     * Erase Emeter Statistics.
     *
     * Sends `emeter.erase_runtime_stat` command. Supports childId.
     * @param   sendOptions
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async eraseStats(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { erase_emeter_stat: {} },
        }, this.childId, sendOptions);
    }
}
exports.default = Emeter;
//# sourceMappingURL=emeter.js.map