"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const schedule_1 = __importStar(require("../shared/schedule"));
const utils_1 = require("../utils");
class PlugSchedule extends schedule_1.default {
    device;
    apiModuleName;
    childId;
    constructor(device, apiModuleName, childId) {
        super(device, apiModuleName, childId);
        this.device = device;
        this.apiModuleName = apiModuleName;
        this.childId = childId;
    }
    /**
     * Adds Schedule rule.
     *
     * Sends `schedule.add_rule` command and returns rule id. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async addRule(rule, sendOptions) {
        const { powerState, dimmer, start, daysOfWeek, name = '', enable = true, } = rule;
        const scheduleRule = {
            sact: powerState ? 1 : 0,
            name,
            enable: enable ? 1 : 0,
            emin: 0,
            etime_opt: -1,
            ...(0, schedule_1.createScheduleRule)({ start, daysOfWeek }),
        };
        if ((0, utils_1.isDefinedAndNotNull)(dimmer)) {
            scheduleRule.sact = 3;
            scheduleRule.s_dimmer = dimmer;
        }
        return super.addRule(scheduleRule, sendOptions);
    }
    /**
     * Edits Schedule rule.
     *
     * Sends `schedule.edit_rule` command and returns rule id. Supports childId.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async editRule(rule, sendOptions) {
        const { id, powerState, dimmer, start, daysOfWeek, name = '', enable = true, } = rule;
        const scheduleRule = {
            id,
            sact: powerState ? 1 : 0,
            name,
            enable: enable ? 1 : 0,
            emin: 0,
            etime_opt: -1,
            ...(0, schedule_1.createScheduleRule)({ start, daysOfWeek }),
        };
        if ((0, utils_1.isDefinedAndNotNull)(dimmer)) {
            scheduleRule.sact = 3;
            scheduleRule.s_dimmer = dimmer;
        }
        return super.editRule(scheduleRule, sendOptions);
    }
}
exports.default = PlugSchedule;
//# sourceMappingURL=schedule.js.map