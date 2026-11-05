import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v418 sparse polarimetric rail", () => {
  it("renders after v417 and exposes honest export and image boundaries", () => {
    const source = readFileSync("app/components/KerrSparsePolarimetricStripV418.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Sparse polarimetric rail");
    expect(source).toContain("不是黑洞偏振图");
    expect(source).toContain("联合 68% 标准化 pL–EVPA 置信椭圆");
    expect(source).toContain('data-atlas-v418-fits-product="binary-table-not-image-hdu"');
    expect(source).toContain('data-atlas-v418-covariance-matrices-in-react-state="false"');
    expect(source).toContain('data-atlas-v418-science-buffer-mutation="false"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrSparsePolarimetricStripV418 />")).toBeGreaterThan(
      observatory.indexOf("<KerrPolarimeterNonlinearCompassV417 />"),
    );
  });
});
