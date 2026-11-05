import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MainlineABetaHeroReviewPanelV611, { CanonicalCoverageFreezeGateV622, StructuredCandidateFieldsV621 } from "./MainlineABetaHeroReviewPanelV611";
import canonicalPackJson from "../data/mainlineACanonicalCoverageV622.generated.json";
import structuredPackJson from "../data/mainlineABetaStellarStructuredCandidateV621.generated.json";
import type { CoveragePackV622 } from "../lib/mainlineACanonicalCoverageV622";
import type { StructuredCandidateV621 } from "../lib/mainlineABetaStellarStructuredCandidateV621";
import { MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE } from "../data/mainlineABetaHeroEvidenceIntakeV607";
import { MAINLINE_A_BETA_STELLAR_PROJECTION } from "../data/mainlineABetaStellarProjectionV607.generated";

describe("MainlineABetaHeroReviewPanelV611", () => {
  it("keeps the four pending heroes visible in the source gate", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect((html.match(/data-mainline-a-beta-hero-review-record=/g) ?? [])).toHaveLength(4);
    for (const row of MAINLINE_A_BETA_HERO_EVIDENCE_INTAKE) expect(html).toContain(row.id);
    expect(html).toContain("四颗待补齐恒星");
    expect(html).toContain("不能写入 A 线恒星运行时");
  });

  it("exposes source identity blockers instead of inventing measurements", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    const pending = MAINLINE_A_BETA_STELLAR_PROJECTION.rows.filter((candidate) => !candidate.presentationReferenceReady);
    for (const row of pending) expect(html).toContain(row.simbadIdentifier);
    for (const blocker of pending[0].blockingReasons) expect(html).toContain(blocker === "positive-parallax-missing" ? "正视差缺失或无效" : blocker === "upstream-reference-missing" ? "上游文献引用缺失" : "组件身份待确认");
    expect(html).toContain("测量写回");
    expect(html).toContain("关闭");
    expect(html).toContain("参数化光球预览；不是观测表面");
  });

  it("renders stable semantic hooks for browser review", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect(html).toContain('data-mainline-a-beta-hero-review="true"');
    expect(html).toContain('data-mainline-a-beta-hero-review-summary="true"');
    expect(html).toContain('data-mainline-a-beta-hero-review-result-count="4"');
    expect(html).toContain('data-mainline-a-beta-hero-review-selected="acrux"');
  });

  it("shows the pending source snapshot and canonical SIMBAD link", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect(html).toContain("awaiting-snapshot-ingest");
    expect(html).toContain("simbad.cds.unistra.fr/simbad/sim-id?Ident=");
    expect(html).toContain("来源摘要");
  });

  it("shows the V615 art evidence boundary without opening runtime admission", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect(html).toContain("美术证据 / V615");
    expect(html).toContain("美术基线 20/24");
    expect(html).toContain("参数化光球");
    expect(html).toContain("运行时白名单关闭");
    expect(html).toContain("measurement not-admitted");
  });

  it("shows the V616 source closure ledger without opening admission", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect(html).toContain("来源闭环 / V616");
    expect(html).toContain("来源闭环 4 条 · 缺口 8 项 · 新快照采集 0/4");
    expect(html).toContain("尚未采集");
    expect(html).toContain("simbad.cds.unistra.fr");
    expect(html).toContain("candidate-only");
  });

  it("shows the V618 fresh capture intake without fabricating responses", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect(html).toContain("新鲜采集入口 / V618");
    expect(html).toContain("V618 0/4 响应已封存");
    expect((html.match(/data-mainline-a-beta-stellar-fresh-capture-row=/g) ?? [])).toHaveLength(4);
    expect(html).toContain("原始响应 0/4");
    expect(html).toContain("candidate-only");
    expect(html).toContain("ODbL-1.0");
  });

  it("shows the V619 raw capture replay boundary separately", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect(html).toContain("原始捕获 / V619");
    expect(html).toContain("V619 0/4 原始响应已捕获");
    expect((html.match(/data-mainline-a-beta-stellar-raw-capture-row=/g) ?? [])).toHaveLength(4);
    expect(html).toContain("4 pending · raw-only");
    expect(html).toContain("raw-only 不等于结构化科学证据");
  });

  it("renders the R60 attempt ledger with fail-closed boundaries", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect(html).toContain("R60 HTTPS 原始捕获与 attempt ledger");
    expect(html).toMatch(/responseCaptured [0-4]/);
    expect((html.match(/data-mainline-a-beta-stellar-raw-attempt-ledger=/g) ?? [])).toHaveLength(1);
    expect(html).toContain("请求开始");
    expect(html).toContain("请求结束");
    expect(html).toContain("超时");
    expect(html).toContain("重试次数");
    expect(html).toContain("HTTP 状态");
    expect(html).toContain("内容类型");
    expect(html).toContain("最终 URL");
    expect(html).toContain("重定向链");
    expect(html).toContain("错误分类");
    expect(html).toContain("请求 fingerprint");
    expect(html).toContain("R60 attempt ledger / 第 1 次");
    expect(html).toMatch(/responseCaptured=[01]/);
    expect(html).toMatch(/请求 fingerprint/);
    expect(html).toContain("raw artifact / SHA-256");
    expect(html).toMatch(/请求开始|尚未开始/);
    expect(html).toMatch(/HTTP 状态/);
    expect(html).toMatch(/raw artifact \/ SHA-256/);
    expect(html).toContain("candidate-only");
    expect(html).toContain("not-admitted");
  });

  it("renders the V621 structured candidate and source/component identity ledgers", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect(html).toContain("V621 结构化解析与 source/component identity");
    expect(html).toMatch(/structured [0-4]\/4 parsed/);
    expect(html).toMatch(/[0-4] blocked/);
    expect(html).toContain("结构化解析与身份台账 / V621");
    expect(html).toMatch(/(?:parse-blocked|parsed-candidate) · hold/);
    expect(html).toContain("normalized fields");
    expect(html).toContain("component identity");
    expect(html).toContain("component hints");
    expect(html).toContain("identity hints / source ledger");
    expect((html.match(/data-mainline-a-beta-stellar-component-hints=/g) ?? [])).toHaveLength(1);
    expect(html).toContain("unresolved · 来源引用待补");
    expect(html).toContain("source ledger");
    expect(html).toMatch(/retrievedAt 待补|2026-09-14T/);
    expect(html).toContain("raw SHA / citation / rights");
    expect(html).toContain("ODbL-1.0");
    expect(html).toContain("scientificPayloadWriteback=false");
    expect((html.match(/data-mainline-a-beta-stellar-structured-row=/g) ?? [])).toHaveLength(4);
    expect(html).toMatch(/缺口：(?:minimum-identity-fields-missing|component-identity)/);
  });

  it("exposes the canonical 12/12/12 coverage freeze and lifecycle gate", () => {
    const html = renderToStaticMarkup(createElement(MainlineABetaHeroReviewPanelV611, { onClose() {} }));
    expect(html).toContain("Canonical coverage / freeze gate · V622");
    expect(html).toContain('data-mainline-a-canonical-coverage="12/12/12"');
    expect(html).toContain("恒星目录");
    expect(html).toContain("星座目录");
    expect(html).toContain("星云目录");
    expect(html).toContain("12/12");
    expect(html).toContain("pending review");
    expect(html).toContain("36 项待补证 · 12 项视觉签署 pending · 12 项版权审核 pending");
    expect(html).toContain("candidate-hold");
    expect(html).toContain("runtime candidate-only");
    expect(html).toContain("measurement not-admitted");
    expect(html).toContain("12 visual signoffs pending");
    expect(html).toContain("canonical payload freeze not sealed");
    expect(html).toContain('data-mainline-a-canonical-state-strip="true"');
    expect(html).toContain("static coverage complete");
    expect(html).toContain("signoff pending");
    expect(html).toContain("下一动作：记录真实路由访问与资源释放");
    expect(html).toContain('data-mainline-a-canonical-lifecycle-checks="true"');
    expect(html).toContain("runtime promotion · blocked");
    expect(html).toContain("不会修改 V616 snapshot/projection digest");
  });
});

describe("canonical coverage evidence boundaries", () => {
  const pack = canonicalPackJson as unknown as CoveragePackV622;

  it("uses actual roster rows when the declared totals are stale", () => {
    const incomplete = { ...pack, records: pack.records.slice(1) };
    const html = renderToStaticMarkup(createElement(CanonicalCoverageFreezeGateV622, { pack: incomplete }));
    expect(html).toContain('data-mainline-a-canonical-coverage="11/12/12"');
    expect(html).toContain("static coverage invalid");
    expect(html).toContain("target-count-invalid");
    expect(html).not.toContain("static coverage complete");
  });

  it("rejects a duplicate roster entry even when all counts still equal twelve", () => {
    const records = [...pack.records];
    records[1] = records[0];
    const html = renderToStaticMarkup(createElement(CanonicalCoverageFreezeGateV622, { pack: { ...pack, records } }));
    expect(html).toContain(":duplicate");
    expect(html).toContain("static coverage invalid");
    expect(html).toContain("runtime promotion · blocked");
  });

  it("never turns a complete static catalog into observed runtime or rights approval", () => {
    const html = renderToStaticMarkup(createElement(CanonicalCoverageFreezeGateV622, { pack }));
    expect(html).toContain("static coverage complete");
    expect(html).toContain('data-mainline-a-canonical-evidence-class="static"');
    expect(html).toContain('data-mainline-a-canonical-runtime-observed="false"');
    expect(html).toContain("路由访问 not-run · 资源释放 not-run · 应用视觉 not-run");
    expect(html).not.toContain("rights coverage");
    expect(html).not.toContain("coverage ready");
  });
});

describe("structured field review", () => {
  const candidate = structuredPackJson.records[0] as unknown as StructuredCandidateV621;

  it("shows unknown fields as pending instead of a fabricated zero", () => {
    const missing = { ...candidate, properMotionRaMasYr: null, properMotionDecMasYr: null, parallaxMas: null, parallaxErrorMas: null, fieldEvidence: [] };
    const html = renderToStaticMarkup(createElement(StructuredCandidateFieldsV621, { candidate: missing }));
    expect(html).toContain("待解析");
    expect(html).toContain("原文字段定位未提供");
    expect(html).not.toContain("0 mas");
    expect(html).toContain("数值未写回科学载荷");
  });

  it("keeps a measured zero and quality marker distinct from missing data and spectral type", () => {
    const row = { ...candidate, properMotionRaMasYr: 0, properMotionDecMasYr: -2.5, spectralType: "B1V", spectralQuality: "C", fieldEvidence: [] };
    const html = renderToStaticMarkup(createElement(StructuredCandidateFieldsV621, { candidate: row }));
    expect(html).toContain("0 mas/yr");
    expect(html).toContain("-2.5 mas/yr");
    expect(html).toContain("B1V · C");
    expect(html).toContain("自行 μRA·cosδ");
    expect(html).toContain("组件身份仍需独立核对");
  });

  it("renders raw evidence as escaped text with its exact byte range", () => {
    const row: StructuredCandidateV621 = { ...candidate, fieldEvidence: [{ field: "properMotion", rawText: '<img src=x onerror="bad()">', unit: "mas/yr", quality: "A", bibcodes: ["2007A&A...474..653V"], byteStart: 120, byteEnd: 160 }] };
    const html = renderToStaticMarkup(createElement(StructuredCandidateFieldsV621, { candidate: row }));
    expect(html).toContain("UTF-8 bytes [120, 160)");
    expect(html).toContain("2007A&amp;A...474..653V");
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img");
    expect(html).toContain(candidate.rawPageSha256);
  });
});
