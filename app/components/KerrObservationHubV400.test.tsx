import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v400 observation hub", () => {
  it("mounts one bounded stage without Canvas or science mutation", () => {
    const source = readFileSync("app/components/KerrObservationHubV400.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain("Science Cinematic V12");
    expect(source).toContain('data-atlas-v400-single-stage-mounted="true"');
    expect(source).toContain('data-atlas-v400-science-buffer-mutation="false"');
    expect(source).toContain('data-atlas-v400-cinematic-buffer-mutation="false"');
    expect(source).toContain('data-atlas-v400-scene-revision-mutation="false"');
    expect(source).toContain('data-atlas-v400-canvas-created="false"');
    expect(source).toContain("subscribeAtlasResourceSnapshot");
    expect(source).toContain("subscribeAtlasObservationEvidenceCacheV401");
    expect(source).toContain("data-atlas-v401-evidence-cache-entries");
    expect(source).toContain("data-atlas-v401-evidence-cached-bytes");
    expect(source).toContain("data-atlas-v401-stage-evidence-status");
    expect(source).toContain("evidence.summary");
    expect(source).toContain('acquireAtlasObservationEvidenceCacheScopeV402("v12-observation-hub")');
    expect(source).toContain('acquireAtlasObservationEvidenceCacheScopeV402("v11-measurement-lab")');
    expect(source).toContain("data-atlas-v402-evidence-cache-at-baseline");
    expect(source).toContain("data-atlas-v402-evidence-lifetime-requests");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrObservationHubV400 />");
    expect(workbench).not.toContain("<KerrConstraintForgeV396 />");
  });

  it("keeps the observation workflow free of known mojibake sequences", () => {
    const paths = [
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "app/components/AtlasVisualABControlV261.tsx",
      "app/components/KerrConstraintForgeV396.tsx",
      "app/components/KerrObservationAirlockV397.tsx",
      "app/components/KerrObservationDockV398.tsx",
      "app/components/KerrProvenanceRailV399.tsx",
      "app/components/KerrObservationHubV400.tsx",
    ] as const;
    const mojibake = ["\u8def", "\u9225", "\u87d6", "\u8113", "\u951b", "\ufffd"];
    for (const path of paths) {
      const source = readFileSync(path, "utf8");
      for (const marker of mojibake) expect(source, `${path}: ${marker}`).not.toContain(marker);
    }
    expect(readFileSync("app/components/KerrObservationAirlockV397.tsx", "utf8")).toContain("R\u03bb");
    expect(readFileSync("app/components/KerrObservationHubV400.tsx", "utf8")).toContain("linear / 1\u00b70\u00b70");
  });
});
