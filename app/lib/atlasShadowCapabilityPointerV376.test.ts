import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV376 } from "./atlasShadowCapabilityPointerV376";

describe("v376 pointer", () => {
  it("records an unavailable image without zero fallback", () => {
    const pointer = parseAtlasShadowCapabilityPointerV376(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/release/orbit-atlas-current-local-shadow-candidate-v376.json",
          ),
          "utf8",
        ),
      ),
    );
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v375DualAuthorityEnvelope: "unavailable",
        v376Compiler: "implemented-4x3-float64-eight-layer-conservative",
        v376Input: "blocked-0-of-1",
        v376Build: "not-run-attempt-unconsumed",
        v376ScienceImage: "unavailable-no-pixel-arrays",
        v376JsonCsv: "unavailable",
        v376ZeroImageFallback: "disabled",
        v376ObservedCounts: "unavailable-expectation-is-not-observation",
        v314CorrectedDense: "incomplete-0-of-49",
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
