"use strict";
/* eslint camelcase: ["off"] */
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
class BulbSchedule extends schedule_1.default {
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
     * Sends `schedule.add_rule` command and returns rule id.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async addRule(rule, sendOptions) {
        const { lightState, start, daysOfWeek, name = '', enable = true } = rule;
        const scheduleRule = {
            s_light: lightState,
            name,
            enable: enable ? 1 : 0,
            sact: 2,
            emin: -1,
            etime_opt: -1,
            ...(0, schedule_1.createScheduleRule)({ start, daysOfWeek }),
        };
        return super.addRule(scheduleRule, sendOptions);
    }
    /**
     * Edits Schedule rule.
     *
     * Sends `schedule.edit_rule`.
     * @returns parsed JSON response
     * @throws {@link ResponseError}
     */
    async editRule(rule, sendOptions) {
        const { id, lightState, start, daysOfWeek, name = '', enable = true, } = rule;
        const scheduleRule = {
            id,
            s_light: lightState,
            name,
            enable: enable ? 1 : 0,
            sact: 2,
            emin: -1,
            etime_opt: -1,
            ...(0, schedule_1.createScheduleRule)({ start, daysOfWeek }),
        };
        return super.editRule(scheduleRule, sendOptions);
    }
}
exports.default = BulbSchedule;
//# sourceMappingURL=schedule.js.map