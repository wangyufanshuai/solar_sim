import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v395 nullspace observatory", () => {
  it("shows structural nullspace without physical mode attribution", () => {
    const source = readFileSync(
      "app/components/KerrNullspaceObservatoryV395.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v395/observability",
    );
    expect(source).toContain("Nullspace observatory");
    expect(source).toContain('data-atlas-v395-rank="24"');
    expect(source).toContain('data-atlas-v395-nullity="12"');
    expect(source).toContain(
      'data-atlas-v395-physical-mode-attribution="false"',
    );
    expect(source).toContain('data-atlas-v395-nullspace-prior="false"');
    expect(source).toContain('data-atlas-v395-unobservable-zero="false"');
    expect(source).toContain('data-atlas-v395-probability-content="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrNullspaceObservatoryV395 />");
  });
});
