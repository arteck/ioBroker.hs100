"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractResponse = exports.processResponse = exports.processSingleCommandResponse = exports.replaceControlCharacters = exports.compareMac = exports.normalizeMac = exports.hasErrCode = exports.isDefinedAndNotNull = exports.ResponseError = exports.objectHasKey = exports.isObjectLike = void 0;
const lodash_castarray_1 = __importDefault(require("lodash.castarray"));
const lodash_get_1 = __importDefault(require("lodash.get"));
function isObjectLike(candidate) {
    return typeof candidate === 'object' && candidate !== null;
}
exports.isObjectLike = isObjectLike;
function objectHasKey(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
exports.objectHasKey = objectHasKey;
/**
 * Represents an error result received from a TP-Link device.
 *
 * Where response err_code != 0.
 */
class ResponseError extends Error {
    response;
    command;
    modules;
    methods;
    /**
     * Set by `Error.captureStackTrace`
     */
    stack = '';
    /**
     *
     * @param message -
     * @param response -
     * @param command - command sent to device
     * @param modules - array of module names that returned with errors.
     * @param methods - array of method names (format: `${moduleName}.${methodName}`) that returned with errors.
     */
    constructor(message, response, command, modules = [], methods = []) {
        super(message);
        this.response = response;
        this.command = command;
        this.modules = modules;
        this.methods = methods;
        this.name = 'ResponseError';
        this.message = `${message} response: ${response} command: ${command}`;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ResponseError = ResponseError;
function isDefinedAndNotNull(candidate) {
    return candidate !== undefined && candidate !== null;
}
exports.isDefinedAndNotNull = isDefinedAndNotNull;
function hasErrCode(candidate) {
    return isObjectLike(candidate) && typeof candidate.err_code === 'number';
}
exports.hasErrCode = hasErrCode;
function normalizeMac(mac = '') {
    return mac.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
exports.normalizeMac = normalizeMac;
// eslint-disable-next-line @typescript-eslint/default-param-last
function compareMac(mac = '', macPattern) {
    const macPatterns = (0, lodash_castarray_1.default)(macPattern).map((p) => {
        return new RegExp(`^${p
            .replace(/[^A-Za-z0-9?*]/g, '')
            .replace(/[?]/g, '.')
            .replace(/[*]/g, '.*')
            .toUpperCase()}$`);
    });
    const normalizedMac = normalizeMac(mac);
    return macPatterns.findIndex((p) => p.test(normalizedMac)) !== -1;
}
exports.compareMac = compareMac;
function replaceControlCharacters(input, replace = '﹖') {
    return input.replace(/[\x00-\x1F]/g, replace); // eslint-disable-line no-control-regex
}
exports.replaceControlCharacters = replaceControlCharacters;
function flattenResponses(command, response, depth = 0, module = '', results = []) {
    const keys = Object.keys(command);
    if (keys.length === 0) {
        if (depth === 1) {
            results.push({ module, response: {} });
        }
        else if (depth < 1) {
            results.push({ module, response: {} });
        }
    }
    else if (isObjectLike(command) && isObjectLike(response)) {
        for (const key of keys) {
            if (depth === 1) {
                if (key in response && isObjectLike(response[key])) {
                    results.push({
                        module,
                        method: key,
                        response: response[key], // using cast, this is TS bug or limitation. isObjectLike above assures type safety
                    });
                }
                else {
                    results.push({ module, response });
                    return results;
                }
            }
            else if (depth < 1) {
                if (response[key] !== undefined) {
                    flattenResponses(command[key], response[key], depth + 1, key, results);
                }
            }
        }
    }
    return results;
}
/**
 *
 * @param module
 * @param method
 * @param response
 */
function processSingleCommandResponse(module, method, command, response) {
    let responseObj;
    try {
        responseObj = JSON.parse(response);
        if (!isObjectLike(responseObj))
            throw new Error();
    }
    catch (err) {
        throw new ResponseError('Could not parse response', response, command);
    }
    if (!(module in responseObj) ||
        responseObj[module] === undefined ||
        !isObjectLike(responseObj[module])) {
        throw new ResponseError('Module not found in response', response, command);
    }
    const moduleResponse = responseObj[module];
    if (!(method in moduleResponse) || moduleResponse[method] === undefined) {
        throw new ResponseError('Method not found in response', response, command, [
            module,
        ]);
    }
    const methodResponse = moduleResponse[method];
    if (!hasErrCode(methodResponse)) {
        throw new ResponseError('err_code missing', response, command, [module]);
    }
    return methodResponse;
}
exports.processSingleCommandResponse = processSingleCommandResponse;
/**
 *
 * @param command
 * @param response
 * @returns
 * @throws {@link ResponseError}
 */
function processResponse(command, response) {
    if (!isObjectLike(response))
        throw new ResponseError('Response not object', JSON.stringify(response), JSON.stringify(command));
    const multipleResponses = Object.keys(response).length > 1;
    const commandResponses = flattenResponses(command, response);
    const errors = [];
    if (commandResponses.length === 0) {
        throw new ResponseError('err_code missing', JSON.stringify(response), JSON.stringify(command));
    }
    commandResponses.forEach((r) => {
        const res = r.response;
        if (hasErrCode(res)) {
            if (res.err_code !== 0) {
                errors.push({
                    msg: 'err_code not zero',
                    response: res,
                    module: r.module,
                    method: r.method !== undefined ? `${r.module}.${r.method}` : undefined,
                });
            }
        }
        else {
            errors.push({
                msg: 'err_code missing',
                response: res,
                module: r.module,
                method: r.method !== undefined ? `${r.module}.${r.method}` : undefined,
            });
        }
    });
    if (errors.length === 1 && errors[0] !== undefined && !multipleResponses) {
        throw new ResponseError(errors[0].msg, JSON.stringify(errors[0].response), JSON.stringify(command), [errors[0].module], errors[0].method === undefined ? undefined : [errors[0].method]);
    }
    else if (errors.length > 0) {
        throw new ResponseError('err_code', JSON.stringify(response), JSON.stringify(command), errors.map((e) => e.module), errors
            .filter((e) => e.method !== undefined)
            .map((e) => e.method));
    }
    if (commandResponses.length === 1 && commandResponses[0] !== undefined) {
        return commandResponses[0].response;
    }
    return response;
}
exports.processResponse = processResponse;
/**
 * Extract `path` from `response` (from `Client#sendCommand`) and run `typeGuardFn`
 *
 * @param response
 * @param path passed to `lodash.get`
 * @param typeGuardFn
 * @returns value of `path` in `response`
 * @throws Error
 * @throws {@link TypeError}
 */
function extractResponse(response, path, typeGuardFn) {
    const ret = path.length > 0 ? (0, lodash_get_1.default)(response, path) : response;
    if (ret === undefined || !isObjectLike(ret)) {
        throw new Error(`Could not find path:"${path.toString()}" in ${JSON.stringify(response)}`);
    }
    if (!typeGuardFn(ret))
        throw new TypeError(`Unexpected object path:"${path.toString()}" in ${JSON.stringify(response)}`);
    return ret;
}
exports.extractResponse = extractResponse;
//# sourceMappingURL=utils.js.map