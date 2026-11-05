import { describe, expect, it } from "vitest";
import { loadAtlasRelativityEvidenceSnapshotV349, resetRelativityEvidenceServerV349CacheForTests } from "./relativityEvidenceServerV349";

describe("v349 visual evidence", () => {
  it("reports V8 token consumption while preserving the dense fail-closed boundary", async () => {
    resetRelativityEvidenceServerV349CacheForTests();
    const snapshot = await loadAtlasRelativityEvidenceSnapshotV349();
    expect(snapshot).toMatchObject({ version: "v349-relativity-evidence-snapshot", status: "ready", current: { v349: { runtimeMatrixRows: 32, runtimeGroupCount: 8, scienceFieldsEquivalent: true, sciencePayloadByteIdentical: true, cinematicOutputsPairwiseDistinct: true, presentationConsumer: "spectral-ribbon-reticle-channel-separation-seeded-overlay", scienceBufferMutationAllowed: false, denseStatus: "incomplete-0-of-49" } } });
  });
});
