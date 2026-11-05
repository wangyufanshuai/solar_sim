import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MainlineAStellarComponentPanelV634, { WdsPairRowsV634 } from "./MainlineAStellarComponentPanelV634";
import {
  COMPONENT_BOUNDARY_V634, buildComponentEvidenceRecordV634,
  type ComponentArtifactV634, type ComponentCaptureRecordV634,
  type ComponentEvidencePackV634, type ComponentIdV634, type WdsPairV634,
} from "../lib/mainlineAStellarComponentEvidenceV634";

const LEDGER_PATH = "docs/release/v607/mainline-a-stellar-components-v634-20260927-056.json";
const ledgerBytes = readFileSync(LEDGER_PATH);
const ledger = JSON.parse(ledgerBytes.toString("utf8")) as {
  records: ComponentCaptureRecordV634[];
  sourceCandidatePack: ComponentEvidencePackV634["sourceCandidatePack"];
  readme: { artifact: ComponentArtifactV634 };
};

// These tests replay saved HTTPS bytes. Mutations below exist only in memory to
// exercise rendering boundaries; no mutation is a source response or approval.
function replayPack(): ComponentEvidencePackV634 {
  return {
    schema: "mainline-a-stellar-component-evidence-v634", generatedAt: "2026-09-27T03:52:59.829Z",
    captureLedger: { path: LEDGER_PATH, sha256: createHash("sha256").update(ledgerBytes).digest("hex") },
    sourceCandidatePack: ledger.sourceCandidatePack, readme: ledger.readme.artifact,
    boundary: { ...COMPONENT_BOUNDARY_V634 },
    records: ledger.records.map((record) => buildComponentEvidenceRecordV634(record, readFileSync(record.artifact!.path))),
  };
}

function renderPack(pack = replayPack(), selectedId: ComponentIdV634 = "acrux") {
  return renderToStaticMarkup(createElement(MainlineAStellarComponentPanelV634, { pack, selectedId }));
}

function renderPair(patch: Partial<WdsPairV634>) {
  const pair = replayPack().records[0].table!.rows[0];
  return renderToStaticMarkup(createElement(WdsPairRowsV634, { rows: [{ ...pair, ...patch }] }));
}

describe("V634 WDS panel static render boundaries", () => {
  it("renders actual 4-source / 25-pair replay as candidate-only with no identity approval", () => {
    const html = renderPack();
    expect(html).toContain('data-mainline-a-stellar-component-state="catalogue-candidate"');
    expect(html).toContain("真实目录响应 4/4");
    expect(html).toContain("可解析 4/4");
    expect(html).toContain("成对记录 25");
    expect(html).toContain("身份确认 0/4");
    expect(html).toContain("组件身份 unresolved");
    expect(html).toContain("scientificPayloadWriteback=false");
    expect(html).toContain("版权审核 pending");
    expect(html).toContain("不是观测历元");
    expect(html).toContain("仅来源提示，未批准");
    expect(html).toContain("当前 11/11 条目录记录");
  });

  it.each(["acrux", "spica", "regulus", "polaris"] as const)("renders only the selected %s pair rows", (id) => {
    const pack = replayPack();
    const selected = pack.records.find((record) => record.id === id)!;
    const html = renderPack(pack, id);
    expect(html).toContain(`data-mainline-a-stellar-component-selected="${id}"`);
    expect((html.match(/data-mainline-a-wds-pair=/g) ?? []).length).toBe(selected.table!.rows.length);
    expect(html).toContain(`id="wds-filter-${id}"`);
    expect(html).toContain(`for="wds-filter-${id}"`);
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain('target="_blank"');
  });

  it("shows a timeout as an uncaptured pending source without a filter or pair list", () => {
    const pack = replayPack();
    const capture = ledger.records[0];
    const failed = { ...capture, responseCaptured: 0, artifact: null,
      attempts: [{ ...capture.attempts[0], timeout: true, httpStatus: null, errorCategory: "timeout",
        responseCaptured: 0, responseBytes: null, rawArtifact: null }] };
    const pending = buildComponentEvidenceRecordV634(failed, null);
    const html = renderPack({ ...pack, records: [pending, ...pack.records.slice(1)] });
    expect(html).toContain('data-mainline-a-stellar-component-state="capture-pending"');
    expect(html).toContain("真实目录响应 3/4");
    expect(html).toContain("HTTP 未收到");
    expect(html).toContain("timeout true");
    expect(html).toContain("尚无可回放 raw");
    expect(html).not.toContain("data-mainline-a-wds-pair-list");
    expect(html).not.toContain("wds-filter-acrux");
  });

  it("renders parser rejection without displaying suspect rows as candidate evidence", () => {
    const pack = replayPack();
    const capture = ledger.records[0];
    const original = readFileSync(capture.artifact!.path);
    const bytes = Buffer.from(original.toString("utf8").replaceAll("12266-6306", "13252-1110"));
    const artifact = { ...capture.artifact!, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
    const blocked = buildComponentEvidenceRecordV634({ ...capture, artifact,
      attempts: [{ ...capture.attempts[0], responseBytes: bytes.length, rawArtifact: artifact }] }, bytes);
    const html = renderPack({ ...pack, records: [blocked, ...pack.records.slice(1)] });
    expect(html).toContain('data-mainline-a-stellar-component-state="invalid"');
    expect(html).not.toContain("data-mainline-a-wds-pair-list");
    expect(html).not.toContain("wds-filter-acrux");
  });

  it("keeps legitimate parse-blocked status reviewable when raw has no rows", () => {
    const pack = replayPack();
    const capture = ledger.records[0];
    const raw = Buffer.from("<html>Test-only service failure</html>");
    const artifact = { ...capture.artifact!, bytes: raw.length, sha256: createHash("sha256").update(raw).digest("hex") };
    const blocked = buildComponentEvidenceRecordV634({ ...capture, artifact,
      attempts: [{ ...capture.attempts[0], responseBytes: raw.length, rawArtifact: artifact }] }, raw);
    const html = renderPack({ ...pack, records: [blocked, ...pack.records.slice(1)] });
    expect(html).toContain('data-mainline-a-stellar-component-state="parse-blocked"');
    expect(html).toContain("目录解析未通过");
    expect(html).toContain("真实目录响应 4/4");
    expect(html).toContain("可解析 3/4");
    expect(html).not.toContain("data-mainline-a-wds-pair-list");
  });

  it("rejects opened scientific writeback or a missing roster member before rendering source rows", () => {
    const pack = replayPack();
    const invalid = { ...pack, boundary: { ...pack.boundary, scientificPayloadWriteback: true } } as unknown as ComponentEvidencePackV634;
    for (const value of [invalid, { ...pack, records: pack.records.slice(1) }]) {
      const html = renderPack(value);
      expect(html).toContain('data-mainline-a-stellar-component-state="invalid"');
      expect(html).toContain("保持 hold");
      expect(html).not.toContain("data-mainline-a-wds-pair=");
      expect(html).not.toContain("真实目录响应");
    }
  });

  it("never turns an injected source URL into an active link", () => {
    const pack = replayPack();
    const records = pack.records.map((record, index) => index === 0 ? { ...record, requestUrl: "javascript:alert(1)" } : record);
    const html = renderPack({ ...pack, records });
    expect(html).toContain('data-mainline-a-stellar-component-state="invalid"');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<a ");
  });
});

describe("V634 WDS pair row values and escaping", () => {
  it("renders real zero measurements separately from missing values", () => {
    const html = renderPair({ separationArcsec: 0, observationCount: 0,
      firstObservationYear: null, lastObservationYear: null,
      position: { raDeg: 0, decDeg: null, derivedFromName: false } });
    expect(html).toContain("<dd>0 arcsec</dd>");
    expect(html).toContain("<dd>0</dd>");
    expect(html).toContain("0 deg / 未提供或无效");
    expect(html).toContain("未提供或无效 → 未提供或无效");
    const missing = renderPair({ separationArcsec: null });
    expect(missing).not.toContain("null arcsec");
    expect(missing).not.toContain("0 arcsec");
  });

  it("escapes catalogue text, raw rows, and attributes without executing markup", () => {
    const unsafe = '<script>alert("test-only")</script><img src=x onerror=alert(1)>';
    const html = renderPair({ key: unsafe, discoverer: unsafe, notes: unsafe,
      source: { line: 7, byteStart: 20, byteEnd: 99, rawText: unsafe } });
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("line 7 · UTF-8 [20, 99)");
  });

  it("preserves AB,C without claiming that three individual stars were resolved", () => {
    const html = renderPair({ components: "AB,C", relation: "composite-or-unparsed", members: [] });
    expect(html).toContain("AB,C");
    expect(html).toContain("复合／未展开的组件标签");
    expect(html).toContain("不推断成员");
    expect(html).not.toContain("A ↔ B");
  });

  it("keeps empty labels unresolved and derived coordinates visibly approximate", () => {
    const html = renderPair({ components: "", relation: "unlabelled-pair", members: [],
      position: { raDeg: 180, decDeg: -63, derivedFromName: true } });
    expect(html).toContain("组件栏为空");
    expect(html).toContain("不推断成员");
    expect(html).toContain("从 WDS 名称推导，不能作为精确位置");
  });
});
