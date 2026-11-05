import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v392 covariance interlock", () => {
  it("renders the fail-closed V11 admission surface without a Canvas", () => {
    const source = readFileSync(
      "app/components/KerrCovarianceInterlockV392.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v392/covariance-admission",
    );
    expect(source).toContain("Covariance interlock");
    expect(source).toContain('data-atlas-v392-validator-qualified="true"');
    expect(source).toContain(
      'data-atlas-v392-physical-pack-available="false"',
    );
    expect(source).toContain(
      'data-atlas-v392-production-projection="false"',
    );
    expect(source).toContain(
      'data-atlas-v392-unknown-systematics-zero="false"',
    );
    expect(source).toContain(
      'data-atlas-v392-missing-cross-imputed-independent="false"',
    );
    expect(source).toContain('data-atlas-v392-probability-content="false"');
    expect(source).toContain(
      'data-atlas-v392-absolute-temperature-authority="false"',
    );
    expect(source).toContain(
      'data-atlas-v392-science-payload-mutation="false"',
    );
    expect(source).toContain('data-atlas-v392-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrCovarianceInterlockV392 />");
  });
});
