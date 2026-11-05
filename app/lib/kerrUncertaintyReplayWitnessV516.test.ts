import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrUncertaintyReplayWitnessV516,
  parseKerrUncertaintyReplayWitnessArtifactV516,
} from "./kerrUncertaintyReplayWitnessV516";

const artifact = parseKerrUncertaintyReplayWitnessArtifactV516(
  JSON.parse(
    readFileSync(
      "dist/science/kerr-uncertainty-replay-witness-v516/witness-chain.json",
      "utf8",
    ),
  ),
);
const digest = (value: unknown) =>
  createHash("sha256").update(canonicalKerrUncertaintyReplayWitnessV516(value)).digest("hex");

describe("v516 uncertainty replay witness chain", () => {
  it("contains 512 sequential witnesses and eight 64-transition checkpoints", () => {
    expect(artifact.witnesses).toHaveLength(512);
    expect(artifact.checkpoints).toHaveLength(8);
    expect(artifact.chain).toMatchObject({
      transitionCount: 512,
      passCount: 2,
      witnessCount: 512,
      checkpointInterval: 64,
      checkpointCount: 8,
      mismatchCount: 0,
      finalMode: "science",
      finalModeRevision: 512,
    });
    expect(artifact.chain.headSha256).toBe(artifact.chain.repeatHeadSha256);
  });

  it("recomputes every transition witness from the immutable scientific basis", () => {
    let previousWitnessSha256 = artifact.chain.genesisSha256;
    for (const witness of artifact.witnesses) {
      const expected = digest({
        version: "v516-kerr-uncertainty-transition-witness-v1",
        index: witness.index,
        mode: witness.mode,
        revision: witness.revision,
        scientificPayloadKey: artifact.source.scientificPayloadKey,
        scientificRowsSha256: artifact.basis.scientificRowsSha256,
        scienceVisualSignatureSha256: artifact.basis.scienceVisualSignatureSha256,
        cinematicVisualSignatureSha256: artifact.basis.cinematicVisualSignatureSha256,
        previousWitnessSha256,
        numericStyleInputCount: 0,
        scientificMutation: false,
      });
      expect(witness.witnessSha256).toBe(expected);
      previousWitnessSha256 = witness.witnessSha256;
    }
    expect(previousWitnessSha256).toBe(artifact.chain.headSha256);
  });

  it("keeps detector, dense, browser and formal-product boundaries closed", () => {
    expect(artifact.boundary).toMatchObject({
      fullTransitionPayloadEmbedded: false,
      scientificFieldMutationAllowed: false,
      uncertaintyDrivenPresentationAllowed: false,
      detectorAuthorityAvailable: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
      formalDefaultKernel: "legacy-eih-1pn",
    });
    expect(artifact.lifecycle.finalResourceStatus).toBe("baseline");
  });
});
