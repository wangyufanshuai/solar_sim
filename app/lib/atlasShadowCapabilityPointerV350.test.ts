import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV350 } from "./atlasShadowCapabilityPointerV350";

describe("v350 local-shadow pointer", () => {
  it("keeps observation provenance read-only and dense incomplete", () => {
    const pointer = parseAtlasShadowCapabilityPointerV350(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v350.json"), "utf8")));
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v350BandObservation: "qualified-read-only-units-applicability-provenance", v350MeasuredCounts: "unavailable-synthetic-model-only", v350CelestialWcs: "unavailable-sparse-index-grid", v314CorrectedDense: "incomplete-0-of-49", browserQualification: "not-run" } });
  });
});
