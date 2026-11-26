'use strict';

const assert = require('assert');
const Module = require('module');

// minimal stand-in for @iobroker/adapter-core so main.js can be loaded without a controller
class FakeAdapter {
    constructor() {
        this.namespace = 'hs100.0';
        this.config = {};
        this.states = {};
        this.objects = {};
        this.logs = [];
        this.log = {};
        for (const level of ['debug', 'info', 'warn', 'error']) {
            this.log[level] = msg => this.logs.push([level, msg]);
        }
    }
    on() {}
    setState() {}
    setForeignState(id, val) {
        this.states[id] = val;
    }
    async extendObjectAsync(id, obj) {
        this.objects[id] = obj;
    }
    subscribeForeignStates() {}
}

function loadAdapter() {
    const origLoad = Module._load;
    Module._load = function (request, ...rest) {
        return request === '@iobroker/adapter-core' ? {Adapter: FakeAdapter} : origLoad.call(this, request, ...rest);
    };
    try {
        delete require.cache[require.resolve('./main.js')];
        return require('./main.js')({});
    } finally {
        Module._load = origLoad;
    }
}

function fakePlug(overrides = {}) {
    const today = new Date();
    return {
        model: 'HS110(EU)',
        mac: 'AA:BB',
        softwareVersion: '1.0',
        hardwareVersion: '2.0',
        sysInfo: {relay_state: 1, led_off: 0},
        emeter: {
            getRealtime: async () => ({current_ma: 150, power_mw: 12500, voltage_mv: 230000}),
            getDayStats: async () => ({day_list: [{day: today.getDate(), energy_wh: 2500}]}),
            getMonthStats: async () => ({month_list: [{month: today.getMonth() + 1, energy: 3.5}]}),
        },
        ...overrides,
    };
}

describe('main.js adapter', () => {
    it('updates states of an HS110 plug', async () => {
        const adapter = loadAdapter();
        adapter.client.getDevice = async () => fakePlug();

        await adapter.updateDevice({ip: '192.168.0.5', name: 'plug'});

        const ns = 'hs100.0.192_168_0_5';
        assert.strictEqual(adapter.states[`${ns}.state`], true);
        assert.strictEqual(adapter.states[`${ns}.current`], 150);
        assert.strictEqual(adapter.states[`${ns}.power`], 12.5);
        assert.strictEqual(adapter.states[`${ns}.voltage`], 230);
        assert.strictEqual(adapter.states[`${ns}.ledState`], true);
        assert.strictEqual(adapter.states[`${ns}.totalNow`], 2.5);
        assert.strictEqual(adapter.states[`${ns}.totalMonthNow`], 3.5);
    });

    it('logs emeter failures instead of leaving rejected promises', async () => {
        const adapter = loadAdapter();
        const plug = fakePlug();
        plug.emeter.getRealtime = async () => {
            throw new TypeError('Cannot set property realtime');
        };
        adapter.client.getDevice = async () => plug;

        await adapter.updateDevice({ip: '192.168.0.5', name: 'plug'});

        assert.ok(adapter.logs.some(([level, msg]) => level === 'error' && msg.includes('hs_getRealtime')));
        assert.strictEqual(adapter.states['hs100.0.192_168_0_5.totalNow'], 2.5);
    });

    it('creates the plug states', async () => {
        const adapter = loadAdapter();
        adapter.client.getDevice = async () => fakePlug();

        await adapter.cre_state('192.168.0.5', 'plug');

        for (const id of ['state', 'mac', 'model', 'current', 'power', 'voltage', 'ledState', 'totalNow', 'totalMonthNow']) {
            assert.ok(adapter.objects[`192_168_0_5.${id}`], `missing ${id}`);
        }
        assert.strictEqual(adapter.objects['192_168_0_5.state'].common.write, true);
        assert.strictEqual(adapter.objects['192_168_0_5.power'].common.write, false);
    });

    it('switches a device on state change', async () => {
        const adapter = loadAdapter();
        const calls = [];
        adapter.client.getDevice = async () => fakePlug({setPowerState: async val => calls.push(val)});

        await adapter.setDevice('192.168.0.5', 'state', {val: true, ack: false});

        assert.deepStrictEqual(calls, [true]);
    });

    it('sends the changed light value to bulbs', async () => {
        const adapter = loadAdapter();
        const calls = [];
        adapter.client.getDevice = async () =>
            fakePlug({model: 'LB130(EU)', lighting: {setLightState: async s => calls.push(s)}});

        await adapter.setDevice('192.168.0.6', 'brightness', {val: 40, ack: false});

        assert.deepStrictEqual(calls, [{brightness: 40}]);
    });

    it('does not overlap polling cycles', async () => {
        const adapter = loadAdapter();
        adapter.config.devices = [{ip: '192.168.0.5', name: 'plug', active: true}];
        let running = 0;
        let maxRunning = 0;
        adapter.client.getDevice = async () => {
            running++;
            maxRunning = Math.max(maxRunning, running);
            await new Promise(resolve => setTimeout(resolve, 20));
            running--;
            return fakePlug();
        };

        await Promise.all([adapter.getInfos(), adapter.getInfos()]);

        assert.strictEqual(maxRunning, 1);
    });
});
