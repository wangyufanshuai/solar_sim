import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  parseMeasuredVisibleSourceForensicV382R1,
} from "./measuredVisibleSourceForensicV382R1";

describe("v382r1 visible source offline forensic", () => {
  it("preserves attempt 1 failure while qualifying only the already-downloaded source", () => {
    const artifact = parseMeasuredVisibleSourceForensicV382R1(
      JSON.parse(
        readFileSync(
          "dist/science/measured-visible-source-v382r1/forensic.json",
          "utf8",
        ),
      ),
    );
    expect(artifact.progress.qualifiedSourceCount).toBe(1);
    expect(artifact.progress.sourceDossierAvailable).toBe(false);
    expect(artifact.progress.resumeRequiresExplicitAuthorization).toBe(true);
    expect(artifact.correction.networkAttemptedDuringCorrection).toBe(false);
    expect(artifact.attempt1.historicalNegativeEvidencePreserved).toBe(true);
  });
});
