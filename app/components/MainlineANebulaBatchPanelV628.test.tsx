import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import offlinePack from "../data/mainlineANebulaBatchV628.offline.generated.json";
import panel from "./MainlineANebulaBatchPanelV628";
import { nebulaBatchSummaryV628, normalizeNebulaBatchV628 } from "../lib/mainlineANebulaBatchV628";

const source = readFileSync("app/components/MainlineANebulaBatchPanelV628.tsx", "utf8");
const pack = normalizeNebulaBatchV628(offlinePack);

describe("MainlineANebulaBatchPanelV628", () => {
  it("is a client panel with runtime evidence hooks", () => {
    expect(source).toContain('data-mainline-a-nebula-batch="v628"');
    expect(source).toContain('data-mainline-a-nebula-v628-boundary={boundary ? "closed" : "invalid"}');
    expect(source).toContain('data-scientific-payload-writeback="false"');
    expect(source).toContain("搜索 V628 Beta 星云采集");
    expect(source).toContain("没有匹配的 V628 记录");
    expect(panel).toBeTypeOf("function");
  });

  it("renders search, filter, gate and attempt telemetry contracts", () => {
    expect(source).toContain("nebulaBatchGateSummaryV628");
    expect(source).toContain("nebulaBatchAttemptRowsV628");
    expect(source).toContain("fingerprint:");
    expect(source).toContain("nebulaBatchNetworkLabelV628");
    expect(source).toContain("失败只留 ledger");
  });

  it("keeps the offline pack visibly pending", () => {
    const summary = nebulaBatchSummaryV628(pack);
    expect(summary.total).toBe(6);
    expect(summary.notRun).toBe(6);
    expect(summary.captured).toBe(0);
    expect(summary.rightsPending).toBe(6);
    expect(pack.boundary).toMatchObject({ candidateOnly: true, hold: true, notAdmitted: true, scientificPayloadWriteback: false });
  });
});
