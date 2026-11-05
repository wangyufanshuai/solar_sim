import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV363 } from "./atlasShadowCapabilityPointerV363";

describe("v363 capability pointer", () => {
  it("separates planning qualification from measured calibration and execution", () => {
    const pointer = parseAtlasShadowCapabilityPointerV363(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v363.json"), "utf8")));
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: { v361Calibration: "blocked-measured-calibration-input-unavailable", v363CalibrationPlan: "qualified-plan-only-nine-tasks-eleven-requirements", v363Identifiability: "structural-full-rank-7-of-7-numerical-conditioning-awaits-measurements", v363MeasuredAuthority: "blocked-input-unavailable-no-performance-claim", v363TaskExecution: "not-run-plan-only-attempt-not-consumed", v314CorrectedDense: "incomplete-0-of-49", browserQualification: "not-run" } });
    const evidence = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/orbit-atlas-shadow-v363-evidence.json"), "utf8")) as { sourceManifest: { path: string; sha256: string }[]; calibrationPlan: { artifactSha256: string } };
    expect(evidence.calibrationPlan.artifactSha256).toMatch(/^[a-f0-9]{64}$/);
    for (const entry of evidence.sourceManifest) {
      expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), entry.path))).digest("hex"), entry.path).toBe(entry.sha256);
    }
  });
});
