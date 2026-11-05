import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import overlayJson from "../data/mainlineANebulaR72SourceV659.generated.json";
import MainlineANebulaR72ExpansionPanelV659 from
  "../components/MainlineANebulaR72ExpansionPanelV659";
import { inspectR72SourceOverlayV659, selectR72SourceImageV659,
  visibleR72SourceRowsV659,
  type R72SourceOverlayV659 } from "./mainlineAR72ExpansionSourceV659";

const overlay = overlayJson as R72SourceOverlayV659;

function copy(): R72SourceOverlayV659 {
  return structuredClone(overlay);
}

describe("R72 source overlay and web review boundary", () => {
  it("keeps six source identities but only one gated local image", () => {
    const checked = inspectR72SourceOverlayV659(overlay);
    expect(checked.ok).toBe(true);
    expect(checked.imageCount).toBe(1);
    expect(checked.policyHolds).toBe(5);
    expect(checked.creditLimited).toBe(3);
    expect(overlay.rows.filter((row) => row.pageIdentityVerified))
      .toHaveLength(3);
    expect(overlay.rows.filter((row) =>
      row.structuredSourceIdentityVerified)).toHaveLength(6);
    expect(selectR72SourceImageV659(overlay, "california-nebula")?.pin.sha256)
      .toBe(overlay.rows[2].imageRaw?.sha256);
    for (const row of overlay.rows.filter((item) =>
      item.id !== "california-nebula")) {
      expect(selectR72SourceImageV659(overlay, row.id)).toBeNull();
    }
  });

  it("filters source, held-image and missing-current-credit states", () => {
    expect(visibleR72SourceRowsV659(overlay.rows,
      "image-available", "").map((row) => row.id))
      .toEqual(["california-nebula"]);
    expect(visibleR72SourceRowsV659(overlay.rows,
      "policy-hold", "")).toHaveLength(5);
    expect(visibleR72SourceRowsV659(overlay.rows,
      "credit-limited", "").map((row) => row.id))
      .toEqual(["ring-nebula", "bubble-nebula", "cats-eye-nebula"]);
    expect(visibleR72SourceRowsV659(overlay.rows,
      "all", "PIA23650").map((row) => row.id))
      .toEqual(["california-nebula"]);
    expect(visibleR72SourceRowsV659(overlay.rows,
      "all", "nonexistent")).toHaveLength(0);
  });

  it("rejects image promotion on a blocked row", () => {
    const forged = copy();
    const row = forged.rows[0] as typeof forged.rows[number] & {
      imageRaw: typeof forged.rows[number]["imageRaw"];
      imageRequestExecuted: boolean;
    };
    row.imageRaw = overlay.rows[2].imageRaw;
    row.imageRequestExecuted = true;
    expect(inspectR72SourceOverlayV659(forged).ok).toBe(false);
    expect(selectR72SourceImageV659(forged, "ring-nebula")).toBeNull();
  });

  it("rejects forged current credit, page identity and copyright approval", () => {
    const forged = copy();
    (forged.rows[0] as { currentStructuredCreditVerified: boolean })
      .currentStructuredCreditVerified = true;
    (forged.rows[0] as { pageIdentityVerified: boolean })
      .pageIdentityVerified = true;
    (forged.boundary as { rightsSignoff: string }).rightsSignoff = "approved";
    expect(inspectR72SourceOverlayV659(forged).ok).toBe(false);
    expect(selectR72SourceImageV659(forged,
      "california-nebula")).toBeNull();
  });

  it("renders a collapsed source board with exact pending limits", () => {
    const html = renderToStaticMarkup(
      <MainlineANebulaR72ExpansionPanelV659 />);
    expect(html).toContain(
      'data-mainline-a-r72-source-panel="v659"');
    expect(html).toContain(
      'data-mainline-a-r72-source-status="verified"');
    expect(html).toContain(
      'data-mainline-a-r72-image-count="1"');
    expect(html).toContain("原图已存");
    expect(html).toContain("请求未执行");
    expect(html).toContain("版权签署");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("data-mainline-a-r72-loaded-image");
  });
});
