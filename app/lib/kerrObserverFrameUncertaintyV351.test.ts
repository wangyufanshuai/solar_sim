import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseKerrObserverFrameUncertaintyArtifactV351 } from "./kerrObserverFrameUncertaintyV351";

describe("v351 observer-frame uncertainty ledger", () => {
  it("separates additive relative components from dimensionful and angular diagnostics", () => {
    const artifact = parseKerrObserverFrameUncertaintyArtifactV351(JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-observer-frame-uncertainty-v351/ledger.json"), "utf8")));
    expect(artifact).toMatchObject({ status: "qualified-componentwise-observer-frame-ledger", counts: { rayCount: 4, bandCount: 3, rowCount: 12, includedRelativeComponentCount: 4, excludedDiagnosticCount: 4 }, combinationPolicy: "compensated-linear-sum-no-independence-claim-no-rss", syntheticExpectationEnvelope: "unavailable-no-componentwise-photon-response-uncertainty-propagation", denseCampaignStatus: "incomplete-0-of-49" });
    expect(artifact.rows.every((row) => row.excludedDiagnostics.geometryRedshiftDifference.reason.includes("no-double-count") && row.excludedDiagnostics.geometryRadiusDifference.unit === "GM/c^2" && row.syntheticExpectationEnvelope.value === null)).toBe(true);
  });
});
