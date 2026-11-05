import { afterEach, describe, expect, it } from "vitest";
import { loadKerrRadiativeTransferV466, resetKerrRadiativeTransferServerCacheForTestsV466 } from "./kerrRadiativeTransferServerV466";
afterEach(() => resetKerrRadiativeTransferServerCacheForTestsV466());
describe("v466 radiative transfer server", () => { it("single-flights a bounded summary", async () => { const [left, right] = await Promise.all([loadKerrRadiativeTransferV466(), loadKerrRadiativeTransferV466()]); expect(left.artifact.artifactSha256).toBe(right.artifact.artifactSha256); expect(left.summary.fixtureExecution.sciencePixelRows).toBe(0); expect(left.export.bytes.byteLength).toBeLessThanOrEqual(128 * 1024); }); });
