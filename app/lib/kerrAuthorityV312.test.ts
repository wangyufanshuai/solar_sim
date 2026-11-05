import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312,
  createKerrCorrectedAuthorityViewV312,
  parseKerrCorrectedAuthorityV312,
  parseKerrCorrectedAuthorityViewV312,
} from "./kerrAuthorityV312";

const path = resolve(process.cwd(), "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json");

describe("v312 corrected Kerr tolerance authority", () => {
  it("proves a real two-level solver ladder without relaxing science thresholds", () => {
    const bytes = readFileSync(path);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312);
    const authority = parseKerrCorrectedAuthorityV312(JSON.parse(bytes.toString("utf8")));
    expect(authority.toleranceConvergence).toMatchObject({ strictSolverLadderPairCount: 64, expectedStrictSolverLadderPairCount: 64, convergenceObservableCount: 256, numericallyNondegenerate: true });
    expect(authority.toleranceConvergence.distinctConvergenceObservableCount).toBeGreaterThan(0);
    expect(authority.thresholds.maxMassShellResidualRaw).toBeLessThan(1e-10);
    expect(authority.thresholds.maxCarterResidualNormalized).toBeLessThan(1e-10);
    expect(authority.resource.peakRssGiB).toBeGreaterThan(0);
    expect(authority.resource.peakRssGiB).toBeLessThan(2);
    expect(authority.release).toMatchObject({ formalProductPointer: "v263", formalProductPointerAdvanced: false, denseShardExecuted: false, correctedDenseCampaignCreated: false });
  });

  it("creates a bounded view without execution payloads", () => {
    const authority = JSON.parse(readFileSync(path, "utf8"));
    const view = parseKerrCorrectedAuthorityViewV312(createKerrCorrectedAuthorityViewV312(authority));
    expect(view.solverLadder).toMatchObject({ pairCount: 64, expectedPairCount: 64, observableCount: 256, releaseRtol: 1e-11, internalRtol: 1e-13 });
    expect(JSON.stringify(view)).not.toContain("executions");
  });
});
