import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("v319 thin-disk spectrum workbench", () => {
  it("loads only after the Research workbench mounts and keeps sparse/science boundaries visible", () => {
    const component = readFileSync(resolve(process.cwd(), "app/components/KerrThinDiskSpectrumWorkbenchV319.tsx"), "utf8");
    const workbench = readFileSync(resolve(process.cwd(), "app/components/RelativityResearchWorkbenchV280.tsx"), "utf8");
    expect(component).toContain("/api/atlas/relativity-evidence/artifacts/v319-thin-disk-spectrum");
    expect(component).toContain('cache: "no-store"');
    expect(component).toContain("Iν/ν³");
    expect(component).toContain("dense aggregate unavailable");
    expect(component).toContain("不会使用电影亮度回填科学量");
    expect(workbench).toContain("<KerrThinDiskSpectrumWorkbenchV319 spinA={scenario.spinA} />");
  });
});
