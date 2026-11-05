import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV332 } from "./atlasShadowCapabilityPointerV332";

describe("v332 local-shadow capability pointer", () => {
  it("records the explicit instrument boundary without promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v332.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV332(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v332InstrumentResponse: "explicit-area-solid-angle-exposure-throughput-synthetic-fixture",
        v332ScienceBoundary: "response-never-cinematic-color-input-no-real-instrument-calibration",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
