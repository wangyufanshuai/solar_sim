import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import source from "./MainlineANebulaBatchPanelV624";

describe("R64 nebula batch panel contract", () => {
  it("declares V624 semantic hooks and evidence separation", () => {
    const html = readFileSync("app/components/MainlineANebulaBatchPanelV624.tsx", "utf8");
    expect(html).toContain('data-mainline-a-nebula-batch="v624"');
    expect(html).toContain("历史缓存与本轮 HTTPS 响应分开显示");
    expect(html).toContain("candidate-only · hold · not-admitted · science payload off");
    expect(source).toBeTypeOf("function");
  });
  it("does not expose a runtime admission control", () => {
    const html = readFileSync("app/components/MainlineANebulaBatchPanelV624.tsx", "utf8");
    expect(html).not.toContain("runtime-admitted");
    expect(html).toContain("scientificPayloadWriteback");
  });
});

