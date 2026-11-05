import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import MainlineAWorkspaceNavigationV637 from "./MainlineAWorkspaceNavigationV637";

describe("Mainline A navigation render contract", () => {
  it("renders two primary atlas entries and a collapsed secondary disclosure", () => {
    const html = renderToStaticMarkup(<MainlineAWorkspaceNavigationV637
      selectedCatalogId="stellar-hero:altair" toolsVisible onFocus={() => undefined} onOpenPerformance={() => undefined}
    />);
    expect(html).toContain('aria-label="宇宙尺度导航"');
    expect(html).toContain('data-mainline-a-workspace-navigation="v637"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('data-mainline-a-active-panel="none"');
    expect(html).toMatch(/aria-expanded="false"/);
    expect(html).toMatch(/hidden=""[^>]*aria-label="更多图集工具"/);
    expect(html).toContain("恒星名录 · 24");
    expect(html).toContain("恒星补齐");
    expect(html).not.toContain('role="dialog"');
  });

  it("retains the scale journey but hides tools during launch or mobile passport", () => {
    const html = renderToStaticMarkup(<MainlineAWorkspaceNavigationV637
      selectedCatalogId="earth" toolsVisible={false} onFocus={() => undefined} onOpenPerformance={() => undefined}
    />);
    expect(html).toContain('data-mainline-a-tools-visible="false"');
    expect(html).toContain("连续对数尺度");
    expect(html).not.toContain("更多图集工具");
  });
});
