import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV354 } from "./atlasShadowCapabilityPointerV354";

describe("v354 pointer", () => {
  it("keeps synthetic covariance separate from measured response authority", () => {
    const pointer = parseAtlasShadowCapabilityPointerV354(
      JSON.parse(
        readFileSync(
          resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v354.json"),
          "utf8",
        ),
      ),
    );
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v354SpectralCorrelation: "qualified-explicit-positive-definite-synthetic-covariance",
        v354MeasuredCovariance: "unavailable-synthetic-model-not-observatory-calibration",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
