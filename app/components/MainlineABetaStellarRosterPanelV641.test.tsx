import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import source from "./MainlineABetaStellarRosterPanelV641";

describe("Beta stellar roster V641 panel", () => {
  it("exposes the 24-row candidate roster and field/source hooks", () => {
    const html = readFileSync("app/components/MainlineABetaStellarRosterPanelV641.tsx", "utf8");
    expect(source).toBeTypeOf("function");
    expect(html).toContain('data-mainline-a-beta-stellar-roster="v641"');
    expect(html).toContain('data-mainline-a-beta-stellar-roster-fields="true"');
    expect(html).toContain('data-mainline-a-beta-stellar-roster-sources="true"');
    expect(html).toContain('data-mainline-a-beta-stellar-roster-gates="true"');
    expect(html).toContain('data-mainline-a-beta-stellar-roster-replay-reasons="true"');
    expect(html).toContain("candidate-only · hold · not-admitted · scientificPayloadWriteback=false");
  });

  it("keeps unresolved component status visible rather than rendering an admission control", () => {
    const html = readFileSync("app/components/MainlineABetaStellarRosterPanelV641.tsx", "utf8");
    expect(html).toContain("componentReview.status");
    expect(html).toContain("组件身份");
    expect(html).not.toContain("componentConfirmed = true");
    expect(html).not.toContain("runtime-admitted");
  });
});
