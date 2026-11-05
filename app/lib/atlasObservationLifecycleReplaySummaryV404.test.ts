import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  parseAtlasObservationLifecycleReplaySummaryV404,
  parseRelativityLifecycleEvidenceResponseV404,
} from "./atlasObservationLifecycleReplaySummaryV404";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("v404 bounded lifecycle replay summary", () => {
  it("accepts the generated summary and excludes all cycle details", () => {
    const summary = read("dist/science/atlas-observation-lifecycle-summary-v404/summary.json");
    expect(parseAtlasObservationLifecycleReplaySummaryV404(summary)).toBe(summary);
    expect(summary).toMatchObject({
      replay: {
        cycleCount: 30,
        totalRequestCount: 114,
        successCount: 108,
        failureCount: 4,
        releasedPendingRequestCount: 2,
        baselineCycleCount: 30,
      },
      qualification: {
        fixtureReplayQualified: true,
        browserSoakQualified: false,
        productionLifecycleQualified: false,
        cycleDetailsExposed: false,
      },
    });
    expect(summary).not.toHaveProperty("cycles");
    expect(JSON.stringify(summary)).not.toContain('"cycle":');
  });

  it("rejects cycle detail injection and malformed availability", () => {
    const summary = read("dist/science/atlas-observation-lifecycle-summary-v404/summary.json");
    expect(() => parseAtlasObservationLifecycleReplaySummaryV404({ ...summary, cycles: [] })).toThrow("v404-lifecycle-summary-shape");
    expect(() => parseRelativityLifecycleEvidenceResponseV404({
      version: "v404-relativity-lifecycle-evidence-response-v1",
      available: true,
      reason: "ready",
      summary: null,
    })).toThrow("v404-lifecycle-response-identity");
  });
});
