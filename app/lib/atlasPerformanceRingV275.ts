export const ATLAS_PERFORMANCE_RING_VERSION_V275 = "v275-fixed-performance-ring-v1" as const;

export type AtlasPerformanceRingV275 = {
  values: Float32Array;
  cursor: number;
  count: number;
};

export function createAtlasPerformanceRingV275(capacity: number): AtlasPerformanceRingV275 {
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 4096) {
    throw new RangeError("Atlas performance ring capacity is invalid");
  }
  return { values: new Float32Array(capacity), cursor: 0, count: 0 };
}

export function pushAtlasPerformanceSampleV275(ring: AtlasPerformanceRingV275, value: number): void {
  if (!Number.isFinite(value) || value < 0) return;
  ring.values[ring.cursor] = Math.min(60_000, value);
  ring.cursor = (ring.cursor + 1) % ring.values.length;
  ring.count = Math.min(ring.values.length, ring.count + 1);
}

export function readAtlasPerformanceRingV275(ring: AtlasPerformanceRingV275): number[] {
  const output = new Array<number>(ring.count);
  const start = (ring.cursor - ring.count + ring.values.length) % ring.values.length;
  for (let index = 0; index < ring.count; index += 1) {
    output[index] = ring.values[(start + index) % ring.values.length]!;
  }
  return output;
}
