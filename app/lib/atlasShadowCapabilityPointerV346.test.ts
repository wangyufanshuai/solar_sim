import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV346 } from "./atlasShadowCapabilityPointerV346";
describe("v346 local-shadow pointer", () => {
  it("keeps production, dense and browser boundaries explicit", () => {
    const pointer = parseAtlasShadowCapabilityPointerV346(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v346.json"), "utf8")));
    expect(pointer).toMatchObject({ formalProductPointer: "v263", formalProductPointerAdvanced: false, localShadowDefaultApplied: false, capabilities: { v314CorrectedDense: "incomplete-0-of-49", denseAggregate: "unavailable", browserQualification: "not-run" } });
  });
});
