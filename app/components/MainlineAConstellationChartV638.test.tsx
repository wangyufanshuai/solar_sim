import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import MainlineAConstellationChartV607 from "./MainlineAConstellationChartV607";

// These isolated UI negative cases never enter source artifacts or admission.
vi.mock("../data/mainlineAConstellationFiguresV607", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/mainlineAConstellationFiguresV607")>();
  const cyg = actual.MAINLINE_A_CONSTELLATION_FIGURES_V607.Cyg;
  return { ...actual, MAINLINE_A_CONSTELLATION_FIGURES_V607: {
    ...actual.MAINLINE_A_CONSTELLATION_FIGURES_V607,
    NoV: { ...cyg, stars: cyg.stars.map((star) => ({ ...star, magV: null })) },
    Gap: { ...cyg, sourceComplete: false, missingAnchorIds: ["delta_cyg"],
      stars: cyg.stars.filter((star) => star.id !== "delta_cyg"), segments: cyg.segments.filter((pair) => !pair.includes("delta_cyg")) },
    Nil: { ...cyg, sourceComplete: false, stars: [], segments: [], missingAnchorIds: cyg.requiredAnchorIds },
  } };
});

describe("constellation chart source and unknown magnitude UI", () => {
  it("renders actual Cyg/Gem identities, keyboard targets and shared coordinate semantics", () => {
    const cyg = renderToStaticMarkup(createElement(MainlineAConstellationChartV607, { code: "Cyg" }));
    expect(cyg).toContain('data-mainline-a-chart-star="sadr"');
    expect(cyg).toContain('data-mainline-a-chart-star="albireo"');
    expect(cyg).not.toContain('data-mainline-a-chart-star="vega"');
    expect(cyg).not.toContain('data-mainline-a-chart-star="denebokab"');
    const gem = renderToStaticMarkup(createElement(MainlineAConstellationChartV607, { code: "Gem" }));
    expect(gem).toContain('data-mainline-a-chart-star="alhena"');
    expect(gem).not.toContain('data-mainline-a-chart-star="procyon"');
    expect((gem.match(/role="button"/g) ?? [])).toHaveLength(6);
    expect((gem.match(/tabindex="0"/g) ?? [])).toHaveLength(6);
    expect(gem).toContain("主场景与此图共用实名锚点和独立线段");
    expect(gem).toContain('data-mainline-a-chart-scientific-writeback="false"');
  });

  it("keeps nullable V values visible and never crashes or synthesizes zero magnitude", () => {
    const html = renderToStaticMarkup(createElement(MainlineAConstellationChartV607, { code: "NoV" }));
    expect(html).toContain("未提供 V 星等");
    expect(html).not.toContain("V 0.00");
    expect(html).not.toContain("NaN");
    expect(html).toContain('r="2"');
    expect(html).toContain("候选展示仍待审核");
  });

  it("keeps an absent source visible as pending without unresolved edge endpoints", () => {
    const html = renderToStaticMarkup(createElement(MainlineAConstellationChartV607, { code: "Gap" }));
    expect(html).toContain('data-mainline-a-chart-source="incomplete"');
    expect(html).toContain("资料待补：delta_cyg");
    expect(html).not.toContain('data-mainline-a-chart-star="delta_cyg"');
    expect(html).toContain("缺项不以邻近恒星替代");
    expect(html).not.toContain("NaN");
  });

  it("renders an empty-source status instead of selecting an undefined star", () => {
    const html = renderToStaticMarkup(createElement(MainlineAConstellationChartV607, { code: "Nil" }));
    expect(html).toContain('role="status"');
    expect(html).toContain("暂不绘制连线");
    expect(html).not.toContain("<svg");
  });

  it("retains the component-qualified epsilon1 source in chart tooltips", () => {
    const html = renderToStaticMarkup(createElement(MainlineAConstellationChartV607, { code: "Lyr" }));
    expect(html).toContain("HR7051");
    expect(html).toContain("目录组件A");
    expect(html).toContain('data-mainline-a-chart-source="candidate-only"');
  });
});
