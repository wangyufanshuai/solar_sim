import { expect, test } from "./atlasBrowserTestV263";

const ARCHIVE_URL =
  "/api/atlas/content-packs/core/files/data/catalog-healpix-v8/catalog-v8.bin";
const TRACE_RANGES = [
  [9_303_552, 9_312_287],
  [24_453_344, 24_551_583],
  [24_910_176, 24_913_695],
  [25_560_128, 25_617_503],
  [26_887_168, 27_126_559],
  [23_204_160, 23_955_455],
  [27_339_392, 27_580_351],
  [25_170_976, 25_363_903],
] as const;

test("v264.3 buffered transport replays the frozen eight-Range trace", async ({
  request,
}, testInfo) => {
  test.setTimeout(60_000);
  let cursor = 0;
  let active = 0;
  let maximumConcurrency = 0;
  const rows: Array<{
    range: string;
    status: number;
    bytes: number;
    durationMs: number;
    delivery: string | undefined;
  }> = [];
  const started = performance.now();
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (cursor < TRACE_RANGES.length) {
        const index = cursor;
        cursor += 1;
        const [start, end] = TRACE_RANGES[index]!;
        active += 1;
        maximumConcurrency = Math.max(maximumConcurrency, active);
        const requestStarted = performance.now();
        try {
          const response = await request.get(ARCHIVE_URL, {
            headers: { Range: `bytes=${start}-${end}` },
          });
          const body = await response.body();
          rows.push({
            range: `bytes=${start}-${end}`,
            status: response.status(),
            bytes: body.byteLength,
            durationMs: performance.now() - requestStarted,
            delivery: response.headers()["x-atlas-range-delivery"],
          });
        } finally {
          active -= 1;
        }
      }
    }),
  );
  const wallMs = performance.now() - started;
  const bytes = rows.reduce((sum, row) => sum + row.bytes, 0);
  await testInfo.attach("atlas-v264r3-transport-preflight", {
    body: Buffer.from(JSON.stringify({ wallMs, bytes, maximumConcurrency, rows })),
    contentType: "application/json",
  });

  expect(rows).toHaveLength(8);
  expect(rows.every((row) => row.status === 206)).toBe(true);
  expect(rows.every((row) => row.delivery === "buffered-v1")).toBe(true);
  expect(bytes).toBe(1_592_448);
  expect(maximumConcurrency).toBeLessThanOrEqual(4);
  expect(wallMs).toBeLessThanOrEqual(250);
});
