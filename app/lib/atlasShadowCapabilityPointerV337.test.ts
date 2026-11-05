import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV337 } from "./atlasShadowCapabilityPointerV337";

describe("v337 local-shadow capability pointer", () => {
  it("records immutable sparse rendering without dense or product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v337.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV337(pointer)).toBe(true);
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v337ScientificBuffers: "all-typed-arrays-byte-identical-before-after-rendering",
        v337MeasurementIntegrity: "classification-redshift-evpa-intensity-error-budgets-unchanged",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
        browserQualification: "not-run",
      },
    });
  });
});
