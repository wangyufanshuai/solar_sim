import { afterEach, describe, expect, it } from "vitest";
import { loadKerrDetectorObservationInputsV446, resetKerrDetectorObservationInputsServerCacheForTestsV446 } from "./kerrDetectorObservationInputsServerV446";
afterEach(() => resetKerrDetectorObservationInputsServerCacheForTestsV446());
describe("v446 detector observation input server", () => { it("loads a bounded summary and immutable contract", async () => { const loaded = await loadKerrDetectorObservationInputsV446(); expect(loaded.summary.requiredFileCount).toBe(4); expect(loaded.summary.readyFileCount).toBe(0); expect(loaded.summary.throughputDoubleCountingRejected).toBe(true); expect(Object.keys(loaded.exports)).toEqual(["inspect", "contract"]); }); });
