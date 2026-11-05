import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAtlasShadowCapabilityPointerV428 } from "./atlasShadowCapabilityPointerV428";

describe("v428 local-shadow pointer", () => {
  it("qualifies only the intake firewall and preserves measured authority as unavailable", () => {
    const pointer = JSON.parse(readFileSync("dist/release/orbit-atlas-current-local-shadow-candidate-v428.json", "utf8"));
    expect(isAtlasShadowCapabilityPointerV428(pointer)).toBe(true);
    expect(pointer.capabilities).toMatchObject({ v427AcquisitionPack: "qualified-preserved", v428SubmissionSchema: "qualified-seven-files-six-csv", v428ArchiveFirewall: "qualified", v428PythonTypeScriptCrossValidation: "qualified", v428AdversarialMutations: "rejected-12-of-12", v428MeasuredSubmissionCount: "zero", v428MeasuredImportAttempts: "zero", v428MeasuredResponseAuthority: "unavailable", v314CorrectedDense: "incomplete-0-of-49" });
  });
});
