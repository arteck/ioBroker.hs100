'use strict';

const assert = require('assert');
const {Client} = require('./lib/tplink-smarthome-api');

describe('vendored tplink-smarthome-api', () => {
    it('exports a Client with the adapter send options', () => {
        const client = new Client({
            defaultSendOptions: {timeout: 20000, transport: 'tcp'},
        });

        assert.strictEqual(typeof client.getDevice, 'function');
        assert.deepStrictEqual(
            {
                timeout: client.defaultSendOptions.timeout,
                transport: client.defaultSendOptions.transport,
            },
            {timeout: 20000, transport: 'tcp'},
        );
    });
});
