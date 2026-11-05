import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v381 measured authority identity surface", () => {
  it("wires a local-shadow V11 three-lane patch bay without runtime mutation", () => {
    const source = readFileSync(
      "app/components/MeasuredAuthorityIdentitySurfaceV381.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain(
      "profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377",
    );
    expect(source).toContain(
      "/api/atlas/relativity-evidence/v381/measured-authority-identity",
    );
    expect(source).toContain("spectral authority patch bay");
    expect(source).toContain('data-atlas-v381-cross-band-identity="false"');
    expect(source).toContain('data-atlas-v381-authority-promotion="false"');
    expect(source).toContain('data-atlas-v381-science-buffer-mutation="false"');
    expect(source).toContain('data-atlas-v381-cinematic-consumer="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<MeasuredAuthorityIdentitySurfaceV381 />");
  });
});
