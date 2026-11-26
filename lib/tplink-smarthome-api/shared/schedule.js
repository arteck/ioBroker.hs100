"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRule = exports.createScheduleRule = exports.isScheduleRulesResponse = exports.hasRuleListWithRuleIds = exports.isScheduleNextActionResponse = void 0;
const utils_1 = require("../utils");
function isScheduleNextAction(candidate) {
    return (0, utils_1.isObjectLike)(candidate);
}
function isScheduleNextActionResponse(candidate) {
    return isScheduleNextAction(candidate) && (0, utils_1.hasErrCode)(candidate);
}
exports.isScheduleNextActionResponse = isScheduleNextActionResponse;
function hasRuleListWithRuleIds(candidate) {
    return ((0, utils_1.isObjectLike)(candidate) &&
        'rule_list' in candidate &&
        (0, utils_1.isObjectLike)(candidate.rule_list) &&
        Array.isArray(candidate.rule_list) &&
        candidate.rule_list.every((rule) => (0, utils_1.isObjectLike)(rule) && 'id' in rule && typeof rule.id === 'string'));
}
exports.hasRuleListWithRuleIds = hasRuleListWithRuleIds;
function isScheduleRules(candidate) {
    return ((0, utils_1.isObjectLike)(candidate) &&
        'rule_list' in candidate &&
        (0, utils_1.isObjectLike)(candidate.rule_list) &&
        Array.isArray(candidate.rule_list) &&
        candidate.rule_list.every((rule) => (0, utils_1.isObjectLike)(rule) && 'id' in rule && typeof rule.id === 'string'));
}
function isScheduleRulesResponse(candidate) {
    return isScheduleRules(candidate) && (0, utils_1.hasErrCode)(candidate);
}
exports.isScheduleRulesResponse = isScheduleRulesResponse;
function createScheduleDate(date, startOrEnd) {
    let min = 0;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let time_opt = 0;
    if (date instanceof Date) {
        min = date.getHours() * 60 + date.getMinutes();
    }
    else if (typeof date === 'number') {
        min = date;
    }
    else if (date === 'sunrise') {
        min = 0;
        time_opt = 1;
        // We want to validate
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    }
    else if (date === 'sunset') {
        min = 0;
        time_opt = 2;
    }
    else {
        throw new Error('invalid date');
    }
    if (startOrEnd === 'end') {
        return { emin: min, etime_opt: time_opt };
    }
    return { smin: min, stime_opt: time_opt };
}
function createScheduleDateStart(date) {
    return createScheduleDate(date, 'start');
}
function createScheduleDateEnd(date) {
    return createScheduleDate(date, 'end');
}
function createWday(daysOfWeek) {
    const wday = [false, false, false, false, false, false, false];
    daysOfWeek.forEach((dw) => {
        wday[dw] = true;
    });
    return wday;
}
function createScheduleRule({ start, daysOfWeek, }) {
    const sched = createScheduleDateStart(start);
    if ((0, utils_1.isDefinedAndNotNull)(daysOfWeek) && daysOfWeek.length > 0) {
        sched.wday = createWday(daysOfWeek);
        sched.repeat = true;
    }
    else {
        const date = start instanceof Date ? start : new Date();
        sched.day = date.getDate();
        sched.month = date.getMonth() + 1;
        sched.year = date.getFullYear();
        sched.wday = [false, false, false, false, false, false, false];
        sched.wday[date.getDay()] = true;
        sched.repeat = false;
    }
    return sched;
}
exports.createScheduleRule = createScheduleRule;
function createRule({ start, end, daysOfWeek, }) {
    const sched = createScheduleDateStart(start);
    if ((0, utils_1.isDefinedAndNotNull)(end)) {
        Object.assign(sched, createScheduleDateEnd(end));
    }
    if ((0, utils_1.isDefinedAndNotNull)(daysOfWeek) && daysOfWeek.length > 0) {
        sched.wday = createWday(daysOfWeek);
        sched.repeat = true;
    }
    else {
        const date = start instanceof Date ? start : new Date();
        sched.day = date.getDate();
        sched.month = date.getMonth() + 1;
        sched.year = date.getFullYear();
        sched.wday = [false, false, false, false, false, false, false];
        sched.wday[date.getDay()] = true;
        sched.repeat = false;
    }
    return sched;
}
exports.createRule = createRule;
class Schedule {
    device;
    apiModuleName;
    childId;
    nextAction;
    constructor(device, apiModuleName, childId) {
        this.device = device;
        this.apiModuleName = apiModuleName;
        this.childId = childId;
    }
    /**
     * Gets Next Schedule Rule Action.
     *
     * Requests `schedule.get_next_action`. Supports childId.
     * @throws {@link ResponseError}
     */
    async getNextAction(sendOptions) {
        this.nextAction = (0, utils_1.extractResponse)(await this.device.sendCommand({
            [this.apiModuleName]: { get_next_action: {} },
        }, this.childId, sendOptions), '', isScheduleNextActionResponse);
        return this.nextAction;
    }
    /**
     * Gets Schedule Rules.
     *
     * Requests `schedule.get_rules`. Supports childId.
     * @throws {@link ResponseError}
     */
    async getRules(sendOptions) {
        return (0, utils_1.extractResponse)(await this.device.sendCommand({
            [this.apiModuleName]: { get_rules: {} },
        }, this.childId, sendOptions), '', isScheduleRulesResponse);
    }
    /**
     * Gets Schedule Rule.
     *
     * Requests `schedule.get_rules` and return rule matching Id. Supports childId.
     * @throws {@link ResponseError}
     * @throws Error
     */
    async getRule(id, sendOptions) {
        const rules = await this.getRules(sendOptions);
        const rule = rules.rule_list.find((r) => r.id === id);
        if (rule === undefined)
            throw new Error(`Rule id not found: ${id}`);
        return { ...rule, err_code: rules.err_code };
    }
    /**
     * Adds Schedule rule.
     *
     * Sends `schedule.add_rule` command and returns rule id. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async addRule(rule, sendOptions) {
        return (0, utils_1.extractResponse)(await this.device.sendCommand({
            [this.apiModuleName]: { add_rule: rule },
        }, this.childId, sendOptions), '', (candidate) => {
            return (0, utils_1.isObjectLike)(candidate) && typeof candidate.id === 'string';
        });
    }
    /**
     * Edits Schedule Rule.
     *
     * Sends `schedule.edit_rule` command. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async editRule(rule, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { edit_rule: rule },
        }, this.childId, sendOptions);
    }
    /**
     * Deletes All Schedule Rules.
     *
     * Sends `schedule.delete_all_rules` command. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async deleteAllRules(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { delete_all_rules: {} },
        }, this.childId, sendOptions);
    }
    /**
     * Deletes Schedule Rule.
     *
     * Sends `schedule.delete_rule` command. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async deleteRule(id, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { delete_rule: { id } },
        }, this.childId, sendOptions);
    }
    /**
     * Enables or Disables Schedule Rules.
     *
     * Sends `schedule.set_overall_enable` command. Supports childId.
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
    /**
     * Get Daily Usage Statistics.
     *
     * Sends `schedule.get_daystat` command. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getDayStats(year, month, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { get_daystat: { year, month } },
        }, this.childId, sendOptions);
    }
    /**
     * Get Monthly Usage Statistics.
     *
     * Sends `schedule.get_monthstat` command. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async getMonthStats(year, sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { get_monthstat: { year } },
        }, this.childId, sendOptions);
    }
    /**
     * Erase Usage Statistics.
     *
     * Sends `schedule.erase_runtime_stat` command. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async eraseStats(sendOptions) {
        return this.device.sendCommand({
            [this.apiModuleName]: { erase_runtime_stat: {} },
        }, this.childId, sendOptions);
    }
}
exports.default = Schedule;
//# sourceMappingURL=schedule.js.map