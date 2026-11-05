import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV367 } from "./atlasShadowCapabilityPointerV367";

describe("v367 capability pointer", () => {
  it("records admission implementation without inventing measured authority", () => {
    const pointer = parseAtlasShadowCapabilityPointerV367(JSON.parse(readFileSync(resolve(process.cwd(), "dist/release/orbit-atlas-current-local-shadow-candidate-v367.json"), "utf8")));
    expect(pointer).toMatchObject({ formalProductPointer: "v263", localShadowDefaultApplied: false, capabilities: {
      v367AdmissionController: "implemented-explicit-identity-sha-independent-validation-fail-closed",
      v367AdmissionInput: "blocked-0-of-7-inputs-present",
      v367AdmissionExecution: "not-run-attempt-not-consumed",
      v367TestFixture: "rejected-nonpublishable-even-if-numerically-qualified",
      v367MeasuredAuthority: "unavailable-no-authority-granted",
      v314CorrectedDense: "incomplete-0-of-49",
      browserQualification: "not-run",
    } });
    const evidence = JSON.parse(readFileSync(resolve(process.cwd(), pointer.evidence.path), "utf8")) as { sourceManifest: { path: string; sha256: string }[] };
    for (const entry of evidence.sourceManifest) expect(createHash("sha256").update(readFileSync(resolve(process.cwd(), entry.path))).digest("hex"), entry.path).toBe(entry.sha256);
  });
});
