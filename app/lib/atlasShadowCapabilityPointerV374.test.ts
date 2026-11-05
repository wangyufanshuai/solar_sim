import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV374 } from "./atlasShadowCapabilityPointerV374";

describe("v374 pointer", () => {
  it("records a publisher without runtime geometry or expectation availability", () => {
    const pointer = parseAtlasShadowCapabilityPointerV374(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/release/orbit-atlas-current-local-shadow-candidate-v374.json",
          ),
          "utf8",
        ),
      ),
    );
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v373AdmissionController: "implemented-identity-sha-validation-fail-closed",
        v374Publisher: "implemented-nine-input-authority-revalidation",
        v374Input: "blocked-0-of-9",
        v374Publication: "not-run-attempt-unconsumed",
        v374RuntimeGeometry: "unavailable",
        v374MeasuredAuthority: "unavailable-no-v373-authority-pointer",
        v374MeasuredExpectation:
          "unavailable-detector-and-geometry-authority-required",
        v314CorrectedDense: "incomplete-0-of-49",
        browserQualification: "not-run",
      },
    });
    const evidence = JSON.parse(
      readFileSync(resolve(process.cwd(), pointer.evidence.path), "utf8"),
    ) as { sourceManifest: { path: string; sha256: string }[] };
    for (const entry of evidence.sourceManifest) {
      expect(
        createHash("sha256")
          .update(readFileSync(resolve(process.cwd(), entry.path)))
          .digest("hex"),
        entry.path,
      ).toBe(entry.sha256);
    }
  });
});
