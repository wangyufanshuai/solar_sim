import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrProvenanceConstellationV518.tsx", "utf8");

describe("v518 provenance constellation surface", () => {
  it("renders eight fixed nodes, seven edges and two visual modes", () => {
    expect(source).toContain('data-atlas-v518-node-count="8"');
    expect(source).toContain('data-atlas-v518-edge-count="7"');
    expect(source).toContain("encoding.edges.map");
    expect(source).toContain("encoding.nodes.map");
    expect(source).toContain('(["science", "cinematic"] as const)');
  });

  it("keeps scientific values out of all presentation styling", () => {
    expect(source).toContain(
      'data-atlas-v518-numeric-scientific-style-input-count="0"',
    );
    expect(source).toContain('data-atlas-v518-hash-driven-style-count="0"');
    expect(source).toContain('data-atlas-v518-uncertainty-driven-style-count="0"');
    expect(source).toContain('data-atlas-v518-scientific-mutation="false"');
    expect(source).toContain('data-atlas-v518-cinematic-writeback="false"');
    expect(source).not.toContain("summary.verification.witnessMismatchCount *");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });
});
