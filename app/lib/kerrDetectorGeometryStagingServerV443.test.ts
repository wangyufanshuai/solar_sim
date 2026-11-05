import { afterEach, describe, expect, it } from "vitest";
import { loadKerrDetectorGeometryStagingV443, resetKerrDetectorGeometryStagingServerCacheForTestsV443 } from "./kerrDetectorGeometryStagingServerV443";
afterEach(() => resetKerrDetectorGeometryStagingServerCacheForTestsV443());
describe("v443 bounded staging server", () => { it("loads six file statuses and two exports", async () => { const loaded = await loadKerrDetectorGeometryStagingV443(); expect(loaded.summary.files).toHaveLength(6); expect(loaded.summary.status).toBe("blocked-staging-directory-missing"); expect(Object.keys(loaded.exports).sort()).toEqual(["contract", "inspect"]); }); });
