import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV377 } from "./atlasShadowCapabilityPointerV377";

describe("v377 pointer", () => {
  it("records the V11 measurement lab without inventing a science image", () => {
    const pointer = parseAtlasShadowCapabilityPointerV377(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/release/orbit-atlas-current-local-shadow-candidate-v377.json",
          ),
          "utf8",
        ),
      ),
    );
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      capabilities: {
        v375MeasuredExpectation: "unavailable-0-of-12",
        v376ScienceImage: "unavailable-no-pixel-arrays",
        v377VisualProfile: "science-cinematic-v11-measurement-lab",
        v377RuntimeTokens: "hud-and-strong-gravity-consumers-wired",
        v377ScienceBoundary: "identity-linear-float64-1-0-0-immutable",
        v377CinematicBoundary: "seeded-decoration-no-science-encoding",
        v377DefaultBoundary: "manual-local-shadow-only-default-legacy-v9",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
    });
    const evidence = JSON.parse(
      readFileSync(resolve(process.cwd(), pointer.evidence.path), "utf8"),
    ) as { sourceManifest: { path: string; sha256: string }[] };
    for (const entry of evidence.sourceManifest) {
      expect(
        createHash("sha256")
          .update(readFileSync(resolve(process.cwd(), entry.path)))
          .digest("hex"),
        entry.path,
      ).toBe(entry.sha256);
    }
  });
});
