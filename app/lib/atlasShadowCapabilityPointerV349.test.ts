import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV349 } from "./atlasShadowCapabilityPointerV349";

describe("v349 local-shadow pointer", () => {
  it("keeps the V8 presentation boundary separate from formal and dense promotion", () => {
    const pointer = parseAtlasShadowCapabilityPointerV349(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v349.json"), "utf8")));
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v349VisualProfile: "science-cinematic-v8-relativistic-spectral-observatory", v349RuntimeMatrix: "v5-v6-v7-v8-eight-groups-thirty-two-consumption-rows", v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", browserQualification: "not-run" } });
  });
});
