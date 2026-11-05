import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (relative: string) => readFileSync(resolve(process.cwd(), relative), "utf8");

describe("v315 corrected authority workbench wiring", () => {
  it("loads current observables from v312/v313/v314 and never labels historical panels as current", () => {
    const observables = source("app/components/KerrScienceObservablesWorkbenchV306.tsx");
    const workbench = source("app/components/RelativityResearchWorkbenchV280.tsx");
    expect(observables).toContain('/artifacts/v315-science-observables');
    expect(observables).toContain("CPU v312 几何与 v313 偏振");
    expect(observables).toContain("dense aggregate unavailable");
    expect(observables).not.toContain('/artifacts/v306-science-observables');
    expect(workbench).toContain('snapshot.current.v315.status === "implemented-awaiting-browser-qualification"');
    expect(workbench).toContain("历史 v296/v297 浏览器视图（不代表当前 v312/v313 authority）");
    expect(workbench.indexOf("<details")).toBeLessThan(workbench.indexOf("<KerrCriticalCurveWorkbenchV300"));
  });

  it("keeps the corrected observable API bounded and dense-incomplete", () => {
    const route = source("app/api/atlas/relativity-evidence/artifacts/[artifact]/route.ts");
    expect(route).toContain('"v315-science-observables"');
    expect(route).toContain("v315-science-observables-view-size-boundary");
    expect(route).toContain("32 * 1024");
    expect(route).toContain("createSparseKerrSciencePayloadV315");
  });
});

