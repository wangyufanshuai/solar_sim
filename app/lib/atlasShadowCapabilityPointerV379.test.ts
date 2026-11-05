import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAtlasShadowCapabilityPointerV379 } from "./atlasShadowCapabilityPointerV379";

describe("v379 pointer", () => {
  it("qualifies contracts and bounded reads without claiming measured inputs", () => {
    const pointer = parseAtlasShadowCapabilityPointerV379(
      JSON.parse(
        readFileSync(
          resolve(
            process.cwd(),
            "dist/release/orbit-atlas-current-local-shadow-candidate-v379.json",
          ),
          "utf8",
        ),
      ),
    );
    expect(pointer).toMatchObject({
      formalProductPointer: "v263",
      localShadowDefaultApplied: false,
      capabilities: {
        v378AuthorityTopology: "qualified-acyclic-10-nodes-9-required-edges",
        v379SchemaContracts: "qualified-7-of-7",
        v379BoundedAuthorityReads: "qualified-8-of-8-v375-inputs",
        v379MeasuredInputs: "missing-0-of-7-present",
        v379FailurePropagation:
          "v375-withheld-v376-withheld-observed-counts-unavailable",
        v379RuntimeConsumer: "v11-qualification-breakers-wired",
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
