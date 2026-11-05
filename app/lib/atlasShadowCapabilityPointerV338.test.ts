import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV338 } from "./atlasShadowCapabilityPointerV338";

describe("v338 local-shadow capability pointer", () => {
  it("records bounded workbench evidence without promotion", () => {
    const pointer = JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v338.json"), "utf8"));
    expect(isAtlasShadowCapabilityPointerV338(pointer)).toBe(true);
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v338EvidenceAdapter: "v336-v337-bounded-sanitized-read-only", v338Workbench: "v336-v337-status-sha-dense-boundary-visible", v314CorrectedDense: "incomplete-0-of-49", browserQualification: "not-run" } });
  });
});
