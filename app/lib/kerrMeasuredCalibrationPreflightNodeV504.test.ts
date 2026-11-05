import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createKerrMeasuredDetectorSyntheticControlV458,
  KERR_MEASURED_DETECTOR_SCHEMA_PACK_V458,
} from "./kerrMeasuredDetectorIntakeValidatorV458";
import { inspectKerrMeasuredCalibrationCandidateV504 } from "./kerrMeasuredCalibrationPreflightNodeV504";

const roots: string[] = [];
const createRoot = () => {
  const root = mkdtempSync(join(tmpdir(), "atlas-v504-"));
  roots.push(root);
  return root;
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("v504 measured calibration preflight node inspector", () => {
  it("reports an empty explicit staging directory without consuming authority", () => {
    const result = inspectKerrMeasuredCalibrationCandidateV504(createRoot());
    expect(result).toMatchObject({
      status: "blocked-inputs-missing",
      stagingRootPresent: true,
      stagingRootSafe: true,
      readyFileCount: 0,
      bytesRead: 0,
      candidateReadyForIndependentValidation: false,
    });
    expect(result.missingFileIds).toHaveLength(6);
  });

  it("recognizes a complete synthetic pack only as validation-only", () => {
    const root = createRoot();
    const control = createKerrMeasuredDetectorSyntheticControlV458();
    for (const schema of KERR_MEASURED_DETECTOR_SCHEMA_PACK_V458.schemas) {
      writeFileSync(join(root, schema.fileName), control[schema.id]);
    }
    const result = inspectKerrMeasuredCalibrationCandidateV504(root);
    expect(result).toMatchObject({
      status: "validation-only",
      readyFileCount: 6,
      contentClass: "synthetic-validation-fixture",
      crossFileIdentityQualified: true,
      provenanceShaLinkageQualified: true,
      licenseBoundaryQualified: true,
      candidateReadyForIndependentValidation: false,
    });
  });

  it("rejects a whitelisted name that is not a regular file before reading it", () => {
    const root = createRoot();
    mkdirSync(join(root, "identity.json"));
    const result = inspectKerrMeasuredCalibrationCandidateV504(root);
    expect(result.status).toBe("blocked-path-safety");
    expect(result.pathSafetyViolationIds).toContain("identity");
    expect(result.files.find((file) => file.id === "identity")).toMatchObject({
      status: "invalid",
      bytes: 0,
      sha256: null,
      reasons: ["path-not-regular-file"],
    });
  });
});
