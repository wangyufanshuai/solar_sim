import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  createKerrDetectorInputAdmissionSummaryV451,
  parseKerrDetectorInputAdmissionArtifactV451,
} from "./kerrDetectorInputAdmissionV451";

const artifact = JSON.parse(
  readFileSync(
    "dist/science/kerr-detector-input-admission-v451/input-admission-qualification.json",
    "utf8",
  ),
);
const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  const transient = new Set(["generatedAt", "artifactSha256"]);
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !transient.has(key))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
};

describe("v451 detector input admission", () => {
  it("preserves the six-file blocked state without granting authority", () => {
    const parsed = parseKerrDetectorInputAdmissionArtifactV451(artifact);
    const summary = createKerrDetectorInputAdmissionSummaryV451(parsed);
    expect(summary.status).toBe("blocked-v443-detector-inputs-missing");
    expect(summary.detector).toMatchObject({
      requiredFileCount: 6,
      readyFileCount: 0,
      missingFileIds: [
        "identity",
        "plate-scale",
        "distortion",
        "psf",
        "pixel-response",
        "provenance",
      ],
    });
    expect(summary.semanticContract).toMatchObject({
      collectingAreaMeansGeometricAreaWithoutThroughput: true,
      throughputNotMultipliedTwice: true,
      observedCountsAvailable: false,
      scienceRasterAllowed: false,
    });
    expect(summary.qualification).toMatchObject({
      measuredDetectorAuthorityGranted: false,
      runtimeProjectionAllowed: false,
      scienceRasterAuthority: false,
    });
  });

  it("rejects a forged ready or measured authority mutation", () => {
    expect(() =>
      parseKerrDetectorInputAdmissionArtifactV451({
        ...artifact,
        status: "candidate-ready-for-independent-validation",
        qualification: {
          ...artifact.qualification,
          measuredDetectorAuthorityGranted: true,
        },
      }),
    ).toThrow("v451-detector-admission-artifact-identity");
  });

  it("retains canonical artifact SHA", () => {
    const canonical = JSON.stringify(canonicalize(artifact));
    expect(createHash("sha256").update(canonical).digest("hex")).toBe(
      artifact.artifactSha256,
    );
  });
});
