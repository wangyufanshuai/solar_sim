import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV326 } from "./atlasShadowCapabilityPointerV326";

describe("v326 local-shadow capability pointer", () => {
  it("records sanitized uncertainty provenance without promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v326.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV326(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v326UncertaintyProvenance: "json-csv-sanitized-twelve-derived-rows",
        v326ObjectUrlLifecycle: "tracked-idempotent",
        v326ScienceBoundary: "no-raw-ray-buffer-no-screenshot-no-path-or-host",
        v314CorrectedDense: "incomplete-0-of-49",
      },
    });
  });
});
