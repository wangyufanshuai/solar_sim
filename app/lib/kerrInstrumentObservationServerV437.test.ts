import { afterEach, describe, expect, it } from "vitest";
import { loadKerrInstrumentObservationV437, resetKerrInstrumentObservationServerCacheForTestsV437 } from "./kerrInstrumentObservationServerV437";
afterEach(() => resetKerrInstrumentObservationServerCacheForTestsV437());
describe("v437 bounded server", () => { it("loads a bounded audit and only two exports", async () => { const loaded = await loadKerrInstrumentObservationV437(); expect(loaded.summary.rows).toHaveLength(24); expect(Object.keys(loaded.exports).sort()).toEqual(["contract", "oracle"]); expect(loaded.exports.oracle.bytes.byteLength).toBeLessThan(128 * 1024); }); });
