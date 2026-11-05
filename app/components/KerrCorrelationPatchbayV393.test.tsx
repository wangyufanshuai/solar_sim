import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v393 correlation patchbay", () => {
  it("renders the source topology without fabricating physical rails", () => {
    const source = readFileSync(
      "app/components/KerrCorrelationPatchbayV393.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v393/covariance-sources",
    );
    expect(source).toContain("Correlation patchbay");
    expect(source).toContain(
      'data-atlas-v393-dossier-validator-qualified="true"',
    );
    expect(source).toContain(
      'data-atlas-v393-physical-dossier-available="false"',
    );
    expect(source).toContain('data-atlas-v393-component-sources="0-of-3"');
    expect(source).toContain('data-atlas-v393-cross-sources="0-of-3"');
    expect(source).toContain(
      'data-atlas-v393-production-pack-built="false"',
    );
    expect(source).toContain(
      'data-atlas-v393-missing-correlation-independent="false"',
    );
    expect(source).toContain('data-atlas-v393-probability-content="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrCorrelationPatchbayV393 />");
  });
});
