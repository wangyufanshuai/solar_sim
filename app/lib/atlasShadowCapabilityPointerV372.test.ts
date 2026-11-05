import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV372 } from "./atlasShadowCapabilityPointerV372";

describe("v372 pointer", () => {
  it("records an independent validator without validation or authority", () => {
    const pointer = parseAtlasShadowCapabilityPointerV372(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/release/orbit-atlas-current-local-shadow-candidate-v372.json",
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
        v371Input: "blocked-0-of-4",
        v372Validator: "implemented-independent-raw-recomputation",
        v372Input: "blocked-0-of-6",
        v372Validation: "not-run-attempt-unconsumed",
        v372MeasuredValidation: "unavailable",
        v372RuntimeGeometry: "unavailable",
        v372MeasuredAuthority: "unavailable-explicit-admission-required",
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
