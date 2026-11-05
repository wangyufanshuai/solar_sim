import { afterEach, describe, expect, it } from "vitest";
import { loadKerrSourceCoordinateAuditV440, resetKerrSourceCoordinateServerCacheForTestsV440 } from "./kerrSourceCoordinateAuditServerV440";
afterEach(() => resetKerrSourceCoordinateServerCacheForTestsV440());
describe("v440 bounded server", () => { it("loads 24 coordinate rows and two exports", async () => { const loaded = await loadKerrSourceCoordinateAuditV440(); expect(loaded.summary.rows).toHaveLength(24); expect(Object.keys(loaded.exports).sort()).toEqual(["contract", "oracle"]); }); });
