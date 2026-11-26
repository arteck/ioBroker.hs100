"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schedule_1 = require("../shared/schedule");
const utils_1 = require("../utils");
class Away {
    device;
    apiModuleName;
    childId;
    constructor(device, apiModuleName, childId = undefined) {
        this.device = device;
        this.apiModuleName = apiModuleName;
        this.childId = childId;
    }
    /**
     * Gets Away Rules.
     *
     * Requests `anti_theft.get_rules`. Support childId.
     * @throws {@link ResponseError}
     */
    async getRules(sendOptions) {
        return (0, utils_1.extractResponse)(await this.device.sendCommand({
            [this.apiModuleName]: { get_rules: {} },
        }, this.childId, sendOptions), '', (c) => (0, schedule_1.hasRuleListWithRuleIds)(c) && (0, utils_1.hasErrCode)(c));
    }
    /**
     * Gets Away Rule.
     *
     * Requests `anti_theft.get_rules` and return rule matching Id. Support childId.
     * @throws {@link ResponseError}
     */
    async getRule(id, sendOptions) {
        const rules = await this.getRules(sendOptions);
        const rule = rules.rule_list.find((r) => r.id === id);
        if (rule === undefined)
            throw new Error(`Rule id not found: ${id}`);
        return { ...rule, err_code: rules.err_code };
    }
    /**
     * Adds Away Rule.
     *
     * Sends `anti_theft.add_rule` command and returns rule id. Support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async addRule(rule, sendOptions) {
        const { start, end, daysOfWeek, frequency = 5, name = '', enable = true, } = rule;
        const awayRule = {
            frequency,
            name,
            enable: enable ? 1 : 0,
            ...(0, schedule_1.createRule)({ start, end, daysOfWeek }),
        };
        return this.device.sendCommand({
            [this.apiModuleName]: { add_rule: awayRule },
        }, this.childId, sendOptions);
    }
    /**
     * Edits Away rule.
     *
     * Sends `anti_theft.edit_rule` command and returns rule id. Support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async editRule(rule, sendOptions) {
        const { id, start, end, daysOfWeek, frequency = 5, name = '', enable = true, } = rule;
        const awayRule = {
            id,
            frequency,
            name,
            enable: enable ? 1 : 0,
            ...(0, schedule_1.createRule)({ start, end, daysOfWeek }),
        };
        return this.device.sendCommand({
            [this.apiModuleName]: { edit_rule: awayRule },
        }, this.childId, sendOptions);
    }
    /**
     * Deletes All Away Rules.
     *
     * Sends `anti_theft.delete_all_rules` command. Support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async deleteAllRules(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { delete_all_rules: {} },
        }, this.childId, sendOptions);
    }
    /**
     * Deletes Away Rule.
     *
     * Sends `anti_theft.delete_rule` command. Support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async deleteRule(id, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { delete_rule: { id } },
        }, this.childId, sendOptions);
    }
    /**
     * Enables or Disables Away Rules.
     *
     * Sends `anti_theft.set_overall_enable` command. Support childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async setOverallEnable(enable, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: {
                set_overall_enable: { enable: enable ? 1 : 0 },
            },
        }, this.childId, sendOptions);
    }
}
exports.default = Away;
//# sourceMappingURL=away.js.map