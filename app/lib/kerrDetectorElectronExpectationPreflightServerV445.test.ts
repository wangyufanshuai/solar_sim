import { afterEach, describe, expect, it } from "vitest";
import { loadKerrDetectorElectronExpectationV445, resetKerrDetectorElectronExpectationServerCacheForTestsV445 } from "./kerrDetectorElectronExpectationPreflightServerV445";
afterEach(() => resetKerrDetectorElectronExpectationServerCacheForTestsV445());
describe("v445 detector electron preflight server", () => { it("loads a bounded summary and two immutable exports", async () => { const loaded = await loadKerrDetectorElectronExpectationV445(); expect(loaded.summary.rows).toHaveLength(4); expect(loaded.summary.counts.computationalElectronExpectationRows).toBe(0); expect(Object.keys(loaded.exports)).toEqual(["preflight", "contract"]); expect(loaded.exports.preflight.bytes.byteLength).toBeLessThan(256 * 1024); }); });
