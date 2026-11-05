import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV375 } from "./atlasShadowCapabilityPointerV375";

describe("v375 pointer", () => {
  it("records one qualified photon input without dual authority or expectations", () => {
    const pointer = parseAtlasShadowCapabilityPointerV375(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/release/orbit-atlas-current-local-shadow-candidate-v375.json",
          ),
          "utf8",
        ),
      ),
    );
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v328PhotonPayload: "qualified-4-rays-12-band-measurements",
        v367DetectorAuthority: "unavailable",
        v374GeometryAuthority: "unavailable",
        v375EnvelopeBuilder: "implemented-dual-authority-no-synthetic-fallback",
        v375Input: "partial-1-of-8",
        v375Build: "not-run-attempt-unconsumed",
        v375MeasuredExpectation: "unavailable-0-of-12",
        v375ObservedCounts: "unavailable-expectation-is-not-observation",
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
