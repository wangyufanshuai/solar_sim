import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MEASURED_AUTHORITY_MISSING_IDS_V379,
  parseMeasuredAuthorityReadinessMatrixV379,
} from "./measuredAuthorityReadinessV379";

const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(
              ([key]) =>
                !["generatedAt", "artifactSha256", "pointerSha256"].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );

describe("v379 measured authority readiness", () => {
  it("qualifies all seven contracts while retaining all seven inputs as missing", () => {
    const artifact = parseMeasuredAuthorityReadinessMatrixV379(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/science/measured-authority-readiness-v379/readiness.json",
          ),
          "utf8",
        ),
      ),
    );
    expect(artifact).toMatchObject({
      expectedMissingInputCount: 7,
      presentInputCount: 0,
      missingInputCount: 7,
      schemaContractQualifiedCount: 7,
      boundedReadQualifiedCount: 7,
      photonAuthorityQualified: true,
      attemptConsumed: false,
      networkAttempted: false,
      downstream: {
        v375EnvelopeAvailable: false,
        v376ScienceImageAvailable: false,
        observedCountsAvailable: false,
        zeroImageFallbackAllowed: false,
        syntheticFallbackAllowed: false,
      },
    });
    expect(artifact.entries.map((entry) => entry.id)).toEqual(
      MEASURED_AUTHORITY_MISSING_IDS_V379,
    );
    expect(artifact.entries.every((entry) => !entry.present)).toBe(true);
    expect(artifact.entries.every((entry) => entry.schemaContractQualified)).toBe(true);
    expect(artifact.entries.every((entry) => entry.boundedReadQualified)).toBe(true);
    expect(new Set(artifact.entries.map((entry) => entry.boundedConsumerSource))).toEqual(
      new Set(["scripts/build-measured-expectation-v375.ts"]),
    );
    expect(
      createHash("sha256")
        .update(JSON.stringify(canonicalize(artifact)))
        .digest("hex"),
    ).toBe(artifact.artifactSha256);
  });

  it("keeps the v375 consumer bounded for every authority input", () => {
    const source = readFileSync("scripts/build-measured-expectation-v375.ts", "utf8");
    for (const key of [
      "detectorAdmission",
      "detectorPointer",
      "detectorManifest",
      "geometryAdmission",
      "geometryPointer",
      "geometryReceipt",
      "geometry",
      "photon",
    ]) {
      expect(source).toContain(`[paths.${key}]`);
    }
    expect(source).toContain("assertMeasuredAuthorityInputSizeV380");
    expect(source).toContain("statSync");
  });
});
