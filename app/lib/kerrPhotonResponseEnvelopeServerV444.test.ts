import { afterEach, describe, expect, it } from "vitest";
import { loadKerrPhotonResponseEnvelopeV444, resetKerrPhotonResponseEnvelopeServerCacheForTestsV444 } from "./kerrPhotonResponseEnvelopeServerV444";
afterEach(() => resetKerrPhotonResponseEnvelopeServerCacheForTestsV444());
describe("v444 bounded response server", () => { it("loads a summary-only envelope and export", async () => { const loaded = await loadKerrPhotonResponseEnvelopeV444(); expect(loaded.summary.rows).toHaveLength(4); expect(Object.keys(loaded.exports)).toEqual(["envelope"]); expect(loaded.summary.qualification.scienceImageAvailable).toBe(false); }); });
