'use strict';

// #Encryption
// 4 byte big-endian length header
// Followed by the payload where each byte is XOR'd with the previous encrypted byte

function encrypt(input, firstKey) {
    if (typeof firstKey === 'undefined') firstKey = 0xAB;
    let buf = Buffer.alloc(input.length);
    //let buf = new Buffer.alloc(input.length)

    let key = firstKey;
    for (let i = 0; i < input.length; i++) {
        buf[i] = input.charCodeAt(i) ^ key;
        key = buf[i];
    }
    return buf;
}

function encrypt2(input, firstKey) {
  if (typeof firstKey === 'undefined') firstKey = 0xAB;
 // var buf = new Buffer(input.length); // node v6: Buffer.alloc(input.length)
  let buf = new Buffer.alloc(input.length)

  let key = firstKey;
  for (let i = 0; i < input.length; i++) {
    buf[i] = input.charCodeAt(i) ^ key;
    key = buf[i];
  }
  return buf;
}

function encryptWithHeader(input, firstKey) {
    let bufMsg = encrypt(input, firstKey);
    let bufLength = Buffer.alloc(4);
    bufLength.writeUInt32BE(input.length, 0);
    return Buffer.concat([bufLength, bufMsg], input.length + 4);
}

function decrypt2(input, firstKey) {
    if (typeof firstKey === 'undefined') firstKey = 0x2B;
    let buf = Buffer.from(input.slice(4));
    let key = firstKey;
    let nextKey;
    for (let i = 0; i < buf.length; i++) {
        nextKey = buf[i];
        buf[i] = buf[i] ^ key;
        key = nextKey;
    }
    return buf;
}

function decrypt(input, firstKey) {
  if (typeof firstKey === 'undefined') firstKey = 0x2B;
  //let buf = new Buffer(input); // node v6: Buffer.from(input)
  let buf = new Buffer.from(input)
  let key = firstKey;
  let nextKey;
  for (let i = 0; i < buf.length; i++) {
    nextKey = buf[i];
    buf[i] = buf[i] ^ key;
    key = nextKey;
  }
  return buf;
}

module.exports = {
    encrypt: encrypt,
    encrypt2: encrypt2,
    encryptWithHeader: encryptWithHeader,
    decrypt: decrypt,
    decrypt2: decrypt2
};