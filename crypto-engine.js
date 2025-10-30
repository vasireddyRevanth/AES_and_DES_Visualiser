/* ---------- utilities ---------- */
export function bytesToBigInt(bytes) {
  // 8 bytes → BigInt
  let n = 0n;
  for (let i = 0; i < 8; i++) n = (n << 8n) | BigInt(bytes[i]);
  return n;
}
export function bigIntToBytes(n) {
  // BigInt → 8 bytes
  const b = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    b[i] = Number(n & 0xffn);
    n = n >> 8n;
  }
  return b;
}
export function popcount8(x) {
  // 0-255
  x = x - ((x >> 1) & 0x55);
  x = (x & 0x33) + ((x >> 2) & 0x33);
  return (x + (x >> 4)) & 0x0f;
}

/* ---------- key derivation (simple but deterministic) ---------- */
export function deriveKey(passphrase, cipher /*string*/, bytesOut = 8) {
  const enc = new TextEncoder();
  const data = enc.encode(passphrase);
  // tiny deterministic hash
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    h ^= data[i];
    h = Math.imul(h, 0x01000193);
  }
  const keyBytes = new Uint8Array(bytesOut);
  for (let i = 0; i < bytesOut; i++) {
    keyBytes[i] = (h >>> (i * 4)) & 0xff;
  }
  return keyBytes;
}

/* ---------- single round (byte shuffle + bit avalanche) ---------- */
export function singleRound(
  blockBytes /*Uint8Array[8]*/,
  roundKey /*Uint8Array[8]*/,
  cipher,
  round,
) {
  const avalBefore = blockBytes.reduce((a, b) => a + popcount8(b), 0);
  // very visual shuffle: rotate + XOR key byte
  const out = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    const src = (i + round) % 8; // rotate
    out[i] = blockBytes[src] ^ roundKey[i];
  }
  const avalAfter = out.reduce((a, b) => a + popcount8(b), 0);
  return {
    newBytes: out,
    avalancheBits: Math.abs(avalAfter - avalBefore),
    stepLog: {
      round,
      beforeHex: bytesToHex(blockBytes),
      afterHex: bytesToHex(out),
    },
  };
}

function bytesToHex(u8) {
  return Array.from(u8, (x) => ("0" + x.toString(16)).slice(-2)).join("");
}
