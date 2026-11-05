import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV335 } from "./atlasShadowCapabilityPointerV335";

describe("v335 local-shadow capability pointer", () => {
  it("records all-kind baseline return without promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v335.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV335(pointer)).toBe(true);
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v335LifecycleKinds: "eleven-registry-kinds-covered", v335BaselineReturn: "identity-owner-bytes-all-zero-diff", v314CorrectedDense: "incomplete-0-of-49" } });
  });
});
