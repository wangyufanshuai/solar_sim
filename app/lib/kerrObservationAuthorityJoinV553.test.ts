import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { canonicalKerrObservationAuthorityJoinV553, compareKerrObservationAuthorityJoinHudEncodingsV553, createKerrObservationAuthorityJoinHudEncodingV553, parseKerrObservationAuthorityJoinV553, resolveKerrObservationAuthorityJoinHudProfileV553 } from "./kerrObservationAuthorityJoinV553";
const artifact = parseKerrObservationAuthorityJoinV553(JSON.parse(readFileSync("dist/science/kerr-observation-authority-join-v553/atlas.json", "utf8"))), sha = (value: unknown) => createHash("sha256").update(canonicalKerrObservationAuthorityJoinV553(value)).digest("hex");
describe("v553 observation authority join", () => {
  it("keeps the five-stage join immutable and measured-input blocked", () => { expect(sha(artifact)).toBe(artifact.artifactSha256); expect(artifact.stages).toHaveLength(5); expect(artifact.join).toMatchObject({ crossVersionIdentityStable: true, measuredInputsComplete: false, userConfirmationsComplete: false, measuredAuthorityGranted: false, scienceRasterQualified: false }); expect(artifact.mutationAudit.rejectedMutationCount).toBe(10); });
  it("keeps Science and Cinematic visual encoding separate from authority", () => { const result = compareKerrObservationAuthorityJoinHudEncodingsV553(createKerrObservationAuthorityJoinHudEncodingV553(artifact, "science"), createKerrObservationAuthorityJoinHudEncodingV553(artifact, "cinematic")); expect(result).toMatchObject({ stageJoinStable: true, authorityStable: true, rasterQualificationStable: true, scientificFieldMutation: false }); expect(resolveKerrObservationAuthorityJoinHudProfileV553("science").scienceBoundary.bloomIntensity).toBe(0); });
});
