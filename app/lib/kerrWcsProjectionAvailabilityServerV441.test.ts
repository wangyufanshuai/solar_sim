import { afterEach, describe, expect, it } from "vitest";
import {
  loadKerrWcsProjectionAvailabilityV441,
  resetKerrWcsProjectionServerCacheForTestsV441,
} from "./kerrWcsProjectionAvailabilityServerV441";

afterEach(() => resetKerrWcsProjectionServerCacheForTestsV441());

describe("v441 bounded WCS projection server", () => {
  it("loads four WCS sources and two read-only exports", async () => {
    const loaded = await loadKerrWcsProjectionAvailabilityV441();
    expect(loaded.summary.rows).toHaveLength(4);
    expect(loaded.summary.counts.joinedSourceCoordinateRowCount).toBe(24);
    expect(Object.keys(loaded.exports).sort()).toEqual(["contract", "oracle"]);
  });
});
