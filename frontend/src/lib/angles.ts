export type Vec3 = { x: number; y: number; z: number };

export function angleDeg(a: Vec3, b: Vec3, c: Vec3): number {
  const bax = a.x - b.x, bay = a.y - b.y, baz = a.z - b.z;
  const bcx = c.x - b.x, bcy = c.y - b.y, bcz = c.z - b.z;
  const dot = bax * bcx + bay * bcy + baz * bcz;
  const mBa = Math.hypot(bax, bay, baz);
  const mBc = Math.hypot(bcx, bcy, bcz);
  if (mBa === 0 || mBc === 0) return NaN;
  const cos = Math.max(-1, Math.min(1, dot / (mBa * mBc)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export const L = {
  LS: 11, RS: 12,
  LE: 13, RE: 14,
  LW: 15, RW: 16,
  LH: 23, RH: 24,
  LA: 27, RA: 28,
} as const;
