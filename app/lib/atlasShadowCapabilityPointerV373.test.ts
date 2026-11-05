import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV373 } from "./atlasShadowCapabilityPointerV373";

describe("v373 pointer", () => {
  it("records an admission controller without authority or runtime publication", () => {
    const pointer = parseAtlasShadowCapabilityPointerV373(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/release/orbit-atlas-current-local-shadow-candidate-v373.json",
          ),
          "utf8",
        ),
      ),
    );
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v371Compiler: "implemented-strict-candidate-only",
        v372Validator: "implemented-independent-raw-recomputation",
        v373AdmissionController: "implemented-identity-sha-validation-fail-closed",
        v373Input: "blocked-0-of-7",
        v373Admission: "not-run-attempt-unconsumed",
        v373AuthorityPointer: "unavailable",
        v373RuntimeGeometry: "unavailable-separate-publication-required",
        v373MeasuredAuthority: "unavailable-no-authority-granted",
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
