/* crypto-engine.js */
export function desRound(block, roundKey) {
  // toy Feistel: returns [newL, newR, avalancheBits]
  const l = block >>> 32;
  const r = block & 0xffffffff;
  const f = feistel(r, roundKey);
  const newL = r;
  const newR = l ^ f;
  const avalanche = popcount(l ^ newL) + popcount(r ^ newR);
  return [(newL << 32) | newR, avalanche];
}
export function feistel(r, k) {
  return (r ^ k) & 0xffffffff;
} // dummy
export function popcount(v) {
  v = v - ((v >> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
  return (((v + (v >> 4)) & 0xf0f0f0f) * 0x1010101) >>> 24;
}
