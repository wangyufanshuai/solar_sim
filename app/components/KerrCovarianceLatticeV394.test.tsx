import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v394 covariance lattice", () => {
  it("renders a deterministic validation lattice without physical promotion", () => {
    const source = readFileSync(
      "app/components/KerrCovarianceLatticeV394.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v394/global-covariance",
    );
    expect(source).toContain("Covariance lattice");
    expect(source).toContain('data-atlas-v394-input-dimension="36"');
    expect(source).toContain('data-atlas-v394-output-dimension="24"');
    expect(source).toContain(
      'data-atlas-v394-physical-global-covariance="false"',
    );
    expect(source).toContain(
      'data-atlas-v394-production-propagation="false"',
    );
    expect(source).toContain(
      'data-atlas-v394-block-independence-assumed="false"',
    );
    expect(source).toContain(
      'data-atlas-v394-missing-cross-row-zero="false"',
    );
    expect(source).toContain('data-atlas-v394-probability-content="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrCovarianceLatticeV394 />");
  });
});
