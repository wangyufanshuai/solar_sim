import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";

/** Preallocated body slots for future asteroid fields (integration uses `activeBodyCount`). */
export const PHYSICS_CAPACITY = 256;

export const PHYSICS_ACTIVE_BODY_COUNT = SOLAR_SYSTEM_BODIES.length;

/** Float64 meta (indices) — written by worker, read by main. */
export const META_F64_SIM_DAYS = 0;
export const META_F64_STEPS_LAST_FRAME = 1;
export const META_F64_SIM_SEC_ADVANCED = 2;
/** Reserved through 7 */
export const META_F64_COUNT = 8;

/** Int32 meta — sequence bump after each worker step (reserved slots follow). */
export const META_I32_SEQ = 0;
export const META_I32_COUNT = 16;

export function physicsSharedBufferByteLength(): number {
  const bodyBytes = PHYSICS_CAPACITY * 3 * 8;
  const massBytes = PHYSICS_CAPACITY * 8;
  const metaF64Bytes = META_F64_COUNT * 8;
  const metaI32Bytes = META_I32_COUNT * 4;
  return bodyBytes * 3 + massBytes + metaF64Bytes + metaI32Bytes;
}

export type PhysicsBufferViews = {
  posM: Float64Array;
  velM: Float64Array;
  mass: Float64Array;
  posAu: Float64Array;
  metaF64: Float64Array;
  metaI32: Int32Array;
};

/**
 * Layout: posM, velM, posAu, mass, metaF64, metaI32 — all in one SAB for one postMessage.
 */
export function createPhysicsBufferViews(
  sab: SharedArrayBuffer
): PhysicsBufferViews {
  let off = 0;
  const f = (n: number) => {
    const a = new Float64Array(sab, off, n);
    off += n * 8;
    return a;
  };
  const i = (n: number) => {
    const a = new Int32Array(sab, off, n);
    off += n * 4;
    return a;
  };

  const body = PHYSICS_CAPACITY * 3;
  const posM = f(body);
  const velM = f(body);
  const posAu = f(body);
  const mass = f(PHYSICS_CAPACITY);
  const metaF64 = f(META_F64_COUNT);
  const metaI32 = i(META_I32_COUNT);
  return { posM, velM, mass, posAu, metaF64, metaI32 };
}

export function createSharedPhysicsArrayBuffer(): SharedArrayBuffer {
  return new SharedArrayBuffer(physicsSharedBufferByteLength());
}
