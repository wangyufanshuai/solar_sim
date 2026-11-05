import { describe, expect, it } from "vitest";
import {
  createAtlasV596VisualCheckpointIdentity,
  deriveAtlasV596VisualCheckpointBuildFingerprint,
  deriveAtlasV596VisualCheckpointId,
} from "./atlasV596VisualCheckpointIdentity";

describe("v596 visual inner-consumer identity", () => {
  it.each(["standalone-full", "vercel-lite"] as const)(
    "accepts final profile tier %s without changing checkpoint authority",
    (runtimeTier) => {
      const sourceSetSha256 = "a".repeat(64);
      const buildFingerprint =
        deriveAtlasV596VisualCheckpointBuildFingerprint(sourceSetSha256);
      const checkpointId = deriveAtlasV596VisualCheckpointId(
        sourceSetSha256,
        buildFingerprint,
      );
      const identity = createAtlasV596VisualCheckpointIdentity({
        sourceSetSha256,
        buildFingerprint,
        checkpointId,
        runtimeTier,
        nodeEnv: "production",
      });
      expect(identity.bindingStatus).toBe("bound");
      expect(identity.runtimeTier).toBe(runtimeTier);
      expect(identity.formalEvidence).toBe(false);
      expect(identity.supplementalOnly).toBe(true);
      expect(identity.promotion).toBe("none");
    },
  );
});
