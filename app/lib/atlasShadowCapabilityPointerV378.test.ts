import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV378 } from "./atlasShadowCapabilityPointerV378";

describe("v378 pointer", () => {
  it("records a qualified topology without promoting missing authorities", () => {
    const pointer = parseAtlasShadowCapabilityPointerV378(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/release/orbit-atlas-current-local-shadow-candidate-v378.json",
          ),
          "utf8",
        ),
      ),
    );
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      formalProductPointerAdvanced: false,
      localShadowDefaultApplied: false,
      capabilities: {
        v375MeasuredExpectation: "unavailable-0-of-12",
        v376ScienceImage: "unavailable-no-pixel-arrays",
        v377VisualProfile: "science-cinematic-v11-measurement-lab",
        v378AuthorityTopology: "qualified-acyclic-10-nodes-9-required-edges",
        v378AuthorityInput: "partial-1-of-8",
        v378ObservedCountsBoundary: "outside-graph-no-node-no-promotion",
        v378RuntimeConsumer: "v11-provenance-cryobus-wired",
        v314CorrectedDense: "incomplete-0-of-49",
        denseAggregate: "unavailable",
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
