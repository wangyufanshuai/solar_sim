import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("v320 fixed-band science workbench", () => {
  it("loads lazily inside Research and exposes exact science/display boundaries", () => {
    const component = readFileSync(resolve(process.cwd(), "app/components/KerrThinDiskBandWorkbenchV320.tsx"), "utf8");
    const workbench = readFileSync(resolve(process.cwd(), "app/components/RelativityResearchWorkbenchV280.tsx"), "utf8");
    expect(component).toContain("/api/atlas/relativity-evidence/artifacts/v320-thin-disk-bands");
    expect(component).toContain('cache: "no-store"');
    expect(component).toContain("fixed · non-adaptive · sparse 4/4");
    expect(component).toContain("SI 辐亮度、误差项和饱和标志始终独立保存");
    expect(component).toContain("no dense image claim");
    expect(workbench).toContain("<KerrThinDiskBandWorkbenchV320 spinA={scenario.spinA} />");
  });
});
