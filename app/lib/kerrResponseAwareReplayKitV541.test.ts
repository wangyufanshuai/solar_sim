import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { resolveKerrPhotonMetrologyObservatoryIntentV541 } from "./kerrPhotonMetrologyObservatoryIntentV541";
import { canonicalKerrResponseAwareReplayKitV541, compareKerrResponseAwareReplayKitHudEncodingsV541, createKerrResponseAwareReplayKitHudEncodingV541, createKerrResponseAwareReplayKitSummaryV541, parseKerrResponseAwareReplayKitArtifactV541 } from "./kerrResponseAwareReplayKitV541";

const artifact = parseKerrResponseAwareReplayKitArtifactV541(JSON.parse(readFileSync("dist/science/kerr-response-aware-replay-kit-v541/atlas.json", "utf8")));
const digest = (value: unknown) => createHash("sha256").update(canonicalKerrResponseAwareReplayKitV541(value)).digest("hex");
describe("v541 standalone replay kit", () => {
  it("is canonical with a deterministic validation result", () => { expect(digest(artifact)).toBe(artifact.artifactSha256); expect(digest(artifact.environment)).toBe(artifact.environment.environmentSha256); expect(digest(artifact.validation.result)).toBe(artifact.validation.result.resultSha256); expect(artifact.members).toHaveLength(7); });
  it("qualifies only the exact locked environment", () => { expect(artifact.environment.runtime).toEqual({ pythonImplementation: "cpython", pythonVersion: "3.12.3", numpyVersion: "2.2.6", astropyVersion: "7.2.0", zlibVersion: "1.3.1" }); expect(artifact.environment).toMatchObject({ strictExactVersions: true, portabilityBeyondLockedEnvironmentQualified: false, absolutePathStored: false }); expect(artifact.qualification.portabilityBeyondLockedEnvironmentQualified).toBe(false); });
  it("keeps Science and Cinematic on the identical kit and result", () => { const summary = createKerrResponseAwareReplayKitSummaryV541(artifact); expect(compareKerrResponseAwareReplayKitHudEncodingsV541(createKerrResponseAwareReplayKitHudEncodingV541(summary, "science"), createKerrResponseAwareReplayKitHudEncodingV541(summary, "cinematic"))).toMatchObject({ replayKitStable: true, environmentLockStable: true, validationResultStable: true, memberCount: 7, subprocessCount: 2, networkAttemptCount: 0, imageHduCount: 0 }); });
  it("authorizes the 43-detail catalog only after explicit local-shadow intent", () => { expect(resolveKerrPhotonMetrologyObservatoryIntentV541("local-shadow", true)).toMatchObject({ observatoryImportAuthorized: true, detailComponentCatalogSize: 43, concurrentDetailSurfaceBudget: 1 }); expect(resolveKerrPhotonMetrologyObservatoryIntentV541("standalone-full", true)).toMatchObject({ observatoryImportAuthorized: false, concurrentDetailSurfaceBudget: 0 }); expect(resolveKerrPhotonMetrologyObservatoryIntentV541("vercel-lite", true)).toMatchObject({ reason: "lite-boundary" }); });
});
