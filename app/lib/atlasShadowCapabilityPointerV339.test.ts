import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV339 } from "./atlasShadowCapabilityPointerV339";

describe("v339 local-shadow capability pointer", () => {
  it("records sanitized provenance without dense or product promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v339.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV339(pointer)).toBe(true);
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v339Provenance: "sanitized-json-csv-summary-only-no-raw-ray-buffer", v339ObjectUrlLifecycle: "two-format-reverse-idempotent-baseline-return", v314CorrectedDense: "incomplete-0-of-49", browserQualification: "not-run" } });
  });
});
