import { describe, expect, it } from "vitest";
import {
  loadRelativityLifecycleEvidenceSummaryV404,
  resetRelativityLifecycleEvidenceServerV404CacheForTests,
} from "./relativityLifecycleEvidenceServerV404";

describe("v404 lifecycle evidence server", () => {
  it("loads one bounded, canonical summary without cycle details", async () => {
    resetRelativityLifecycleEvidenceServerV404CacheForTests();
    const first = await loadRelativityLifecycleEvidenceSummaryV404();
    const second = await loadRelativityLifecycleEvidenceSummaryV404();
    expect(second).toBe(first);
    expect(first.responseBytes).toBeLessThan(128 * 1024);
    expect(first.summary.replay).toMatchObject({ cycleCount: 30, totalRequestCount: 114, baselineCycleCount: 30 });
    expect(first.summary).not.toHaveProperty("cycles");
  });
});
