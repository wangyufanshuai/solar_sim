import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MEASUREMENT_AUTHORITY_INPUT_IDS_V378,
  parseMeasurementAuthorityTopologyV378,
} from "./measurementAuthorityTopologyV378";

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

describe("v378 measurement authority topology", () => {
  it("publishes a deterministic fail-closed 10-node provenance DAG", () => {
    const artifact = parseMeasurementAuthorityTopologyV378(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/science/measurement-authority-topology-v378/topology.json",
          ),
          "utf8",
        ),
      ),
    );
    expect(artifact).toMatchObject({
      presentInputCount: 1,
      missingInputCount: 7,
      nodeCount: 10,
      edgeCount: 9,
      acyclic: true,
      attemptConsumed: false,
      networkAttempted: false,
      denseCampaignStatus: "incomplete-0-of-49",
      browserQualification: "not-run",
      boundaries: {
        syntheticFallbackAllowed: false,
        expectationCanBecomeObservedCounts: false,
        observedCountsNodeExists: false,
        zeroImageFallbackAllowed: false,
        cinematicConsumerAllowed: false,
        sciencePayloadMutationAllowed: false,
      },
    });
    expect(artifact.nodes.filter((node) => node.status === "qualified").map((node) => node.id)).toEqual([
      "v328-photon-radiance",
    ]);
    expect(artifact.nodes.filter((node) => node.status === "missing")).toHaveLength(7);
    expect(artifact.nodes.filter((node) => node.status === "withheld").map((node) => node.id)).toEqual([
      "v375-dual-authority-envelope",
      "v376-expected-electron-image",
    ]);
    expect(artifact.edges.filter((edge) => edge.satisfied).map((edge) => edge.from)).toEqual([
      "v328-photon-radiance",
    ]);
    expect(artifact.topologicalOrder.slice(0, 8)).toEqual(MEASUREMENT_AUTHORITY_INPUT_IDS_V378);
    expect(artifact.nodes.some((node) => node.id.includes("observed"))).toBe(false);
    expect(
      createHash("sha256")
        .update(JSON.stringify(canonicalize(artifact)))
        .digest("hex"),
    ).toBe(artifact.artifactSha256);
  });
});
