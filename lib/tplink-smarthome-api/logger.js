"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const loglevel_1 = __importDefault(require("loglevel"));
const utils_1 = require("./utils");
let loggerId = 0;
function logger({ 
// eslint-disable-next-line @typescript-eslint/no-shadow
logger, level, } = {}) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const loglevelLogger = loglevel_1.default.getLogger(String((loggerId += 1)));
    if ((0, utils_1.isDefinedAndNotNull)(level))
        loglevelLogger.setLevel(level);
    const log = {
        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
        debug: (...msg) => {
            loglevelLogger.debug(...msg);
        },
        info: (...msg) => {
            loglevelLogger.info(...msg);
        },
        warn: (...msg) => {
            loglevelLogger.warn(...msg);
        },
        error: (...msg) => {
            loglevelLogger.error(...msg);
        },
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
    };
    // if logger passed in, call logger functions instead of our loglevel functions
    if ((0, utils_1.isDefinedAndNotNull)(logger)) {
        levels.forEach((loggerLevel) => {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (logger[loggerLevel] !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                log[loggerLevel] = (...msg) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    logger[loggerLevel](...msg);
                };
            }
        });
    }
    return log;
}
exports.default = logger;
//# sourceMappingURL=logger.js.map