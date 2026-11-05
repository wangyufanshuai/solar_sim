import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV362 } from "./atlasShadowCapabilityPointerV362";

describe("v362 capability pointer", () => {
  it("records visual progress and measured calibration failure independently", () => {
    const pointer = parseAtlasShadowCapabilityPointerV362(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v362.json"), "utf8")));
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      capabilities: {
        v361Calibration: "blocked-measured-calibration-input-unavailable",
        v362VisualProfile: "science-cinematic-v9-instrument-lab-shadow",
        v362InstrumentLab: "five-synthetic-stages-qualified-measured-stage-blocked-read-only",
        v314CorrectedDense: "incomplete-0-of-49",
        browserQualification: "not-run",
      },
    });
  });
});
