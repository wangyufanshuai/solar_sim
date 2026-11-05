import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v382r1 visible source forensic surface", () => {
  it("shows an explicit 1/7 recovery without Canvas or authority promotion", () => {
    const source = readFileSync(
      "app/components/MeasuredVisibleSourceForensicSurfaceV382R1.tsx",
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
      "/api/atlas/relativity-evidence/v382/visible-source-forensic",
    );
    expect(source).toContain("One reel recovered. Six remain sealed.");
    expect(source).toContain('data-atlas-v382r1-source-dossier="false"');
    expect(source).toContain('data-atlas-v382r1-authority="false"');
    expect(source).toContain('data-atlas-v382r1-runtime-packaging="false"');
    expect(source).toContain('data-atlas-v382r1-science-buffer-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain(
      "<MeasuredVisibleSourceForensicSurfaceV382R1 />",
    );
  });
});
