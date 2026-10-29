"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { STELLAR_HEROES_V592 } from "../data/stellarHeroesV592.generated";
import { MAINLINE_A_BETA_HERO_COVERAGE } from "../data/mainlineABetaHeroRosterV607";
import { MAINLINE_A_BETA_STELLAR_PROJECTION } from "../data/mainlineABetaStellarProjectionV607.generated";
import heroArtEvidencePack from "../data/mainlineABetaHeroArtEvidencePackV615.generated.json";
import stellarSourceClosurePack from "../data/mainlineABetaStellarSourceClosureV616.generated.json";
import stellarFreshCapturePack from "../data/mainlineABetaStellarFreshCaptureV618.generated.json";
import stellarRawCapturePack from "../data/mainlineABetaStellarRawCaptureV619.generated.json";
import stellarRawAttemptLedgerPack from "../data/mainlineABetaStellarRawAttemptLedgerV620.generated.json";
import stellarStructuredCandidatePack from "../data/mainlineABetaStellarStructuredCandidateV621.generated.json";
import stellarComponentEvidence from "../data/mainlineAStellarComponentEvidenceV634.generated.json";
import betaStellarRosterV641 from "../data/mainlineABetaStellarRosterV641.generated.json";
import betaStellarEvidenceV642 from "../data/mainlineABetaStellarRosterEvidenceV642.generated.json";
import MainlineAStellarComponentPanelV634 from "./MainlineAStellarComponentPanelV634";
import MainlineABetaStellarRosterPanelV641 from "./MainlineABetaStellarRosterPanelV641";
import MainlineABetaStellarRosterEvidencePanelV642 from "./MainlineABetaStellarRosterEvidencePanelV642";
import type { ComponentEvidencePackV634 } from "../lib/mainlineAStellarComponentEvidenceV634";
import type { MainlineABetaStellarRosterPackV641 } from "../lib/mainlineABetaStellarRosterV641";
import type { MainlineABetaStellarEvidencePackV642 } from "../lib/mainlineABetaStellarRosterEvidenceV642";
import canonicalCoveragePack from "../data/mainlineACanonicalCoverageV622.generated.json";
import {
  coverageManifestSummaryV622,
  coveragePackCountV622,
  type CoveragePackV622,
} from "../lib/mainlineACanonicalCoverageV622";
import {
  MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611,
  filterMainlineABetaStellarReviewRowsV611,
  reviewRiskLabelV611,
  summarizeMainlineABetaStellarReviewV611,
  type MainlineABetaStellarReviewRowV611,
} from "../lib/mainlineABetaStellarReviewV611";
import { stellarAtlasColor } from "../lib/mainlineAStellarAtlasV608";
import {
  heroArtEvidenceBlockerLabelsV615,
  heroArtEvidenceStatusLabelV615,
  heroArtEvidenceStatusToneV615,
  summarizeHeroArtEvidenceV615,
  type HeroArtEvidencePackV615,
  type HeroArtEvidenceRecordV615,
} from "../lib/mainlineABetaHeroArtEvidenceV615";
import {
  stellarSourceClosureMissingLabelsV616,
  stellarSourceClosureNextActionV616,
  stellarSourceClosureStatusLabelV616,
  stellarSourceClosureStatusToneV616,
  type StellarSourceClosurePackV616,
  type StellarSourceClosureRecordV616,
} from "../lib/mainlineABetaStellarSourceClosureV616";
import {
  freshCaptureBoundaryLabelV618,
  freshCaptureNextActionV618,
  freshCaptureRecordSummaryV618,
  freshCaptureStateLabelV618,
  type StellarFreshCapturePackV618,
  type StellarFreshCaptureRecordV618,
} from "../lib/mainlineABetaStellarFreshCaptureV618";
import {
  rawCaptureBoundaryLabelV619,
  rawCaptureImmutableDigestLabelV619,
  rawCaptureNextActionV619,
  rawCaptureRecordSummaryV619,
  rawCaptureStateLabelV619,
  rawCaptureTransportLabelV619,
  type StellarRawCapturePackV619,
  type StellarRawCaptureRecordV619,
} from "../lib/mainlineABetaStellarRawCaptureV619";
import {
  rawAttemptErrorLabelV620,
  type StellarRawAttemptLedgerV620,
  type StellarRawAttemptRecordV620,
} from "../lib/mainlineABetaStellarRawAttemptLedgerV620";
import {
  structuredCandidateSummaryV621,
  type StructuredCandidateV621,
} from "../lib/mainlineABetaStellarStructuredCandidateV621";

type Hero = (typeof STELLAR_HEROES_V592)[number];

/**
 * R60 extends the V619 envelope with transport attempt telemetry.  The panel
 * deliberately treats these fields as optional so that it can replay the
 * frozen V619 pending pack while newer collector output is rolled out.
 */
type RawAttemptLedgerFieldsV60 = Readonly<{
  startedAt?: string | null;
  endedAt?: string | null;
  timeout?: boolean | number | string | null;
  retryCount?: number | null;
  httpStatus?: number | null;
  contentType?: string | null;
  finalUrl?: string | null;
  redirectChain?: readonly string[] | null;
  errorClass?: string | null;
  requestFingerprint?: string | null;
}>;

type RawCaptureWithAttemptLedger = StellarRawCaptureRecordV619 & RawAttemptLedgerFieldsV60;

const pendingRows = MAINLINE_A_BETA_STELLAR_REVIEW_ROWS_V611;
const projectionById = new Map<string, (typeof MAINLINE_A_BETA_STELLAR_PROJECTION.rows)[number]>(MAINLINE_A_BETA_STELLAR_PROJECTION.rows.map((row) => [row.id, row]));
const heroById = new Map<string, Hero>(STELLAR_HEROES_V592.map((hero) => [hero.id, hero]));
const artPack = heroArtEvidencePack as unknown as HeroArtEvidencePackV615;
const artEvidenceById = new Map<string, HeroArtEvidenceRecordV615>(artPack.records.map((record) => [record.id, record]));
const sourcePack = stellarSourceClosurePack as unknown as StellarSourceClosurePackV616;
const sourceClosureById = new Map<string, StellarSourceClosureRecordV616>(sourcePack.records.map((record) => [record.id, record]));
const capturePack = stellarFreshCapturePack as unknown as StellarFreshCapturePackV618;
const captureById = new Map<string, StellarFreshCaptureRecordV618>(capturePack.records.map((record) => [record.request.id, record]));
const rawCapturePack = stellarRawCapturePack as unknown as StellarRawCapturePackV619;
const rawCaptureById = new Map<string, StellarRawCaptureRecordV619>(rawCapturePack.records.map((record) => [record.plan.id, record]));
const rawAttemptLedger = stellarRawAttemptLedgerPack as unknown as StellarRawAttemptLedgerV620;
const rawAttemptById = new Map<string, StellarRawAttemptRecordV620>(rawAttemptLedger.records.map((record) => [record.id, record]));
type StructuredCandidatePackV621 = Readonly<{
  schema: string;
  generatedAt: string;
  counts: Readonly<{ total: number; parsedCandidate: number; blocked: number; componentConfirmed: number }>;
  boundary: Readonly<{ candidateOnly: boolean; hold: boolean; notAdmitted: boolean; scientificPayloadWriteback: boolean; runtimeWrites: boolean; measurementWrites: boolean }>;
  records: readonly StructuredCandidateV621[];
}>;
const structuredPack = stellarStructuredCandidatePack as unknown as StructuredCandidatePackV621;
const structuredById = new Map<string, StructuredCandidateV621>(structuredPack.records.map((record) => [record.id, record]));

const STATE_LABELS: Record<MainlineABetaStellarReviewRowV611["state"], string> = {
  blocked: "来源证据阻塞",
  "identity-review": "组件身份复核",
  "presentation-ready": "展示证据完整",
  "runtime-admitted": "运行时准入（不可达）",
};

const STATE_TONES: Record<MainlineABetaStellarReviewRowV611["state"], string> = {
  blocked: "text-amber-100",
  "identity-review": "text-orange-100",
  "presentation-ready": "text-emerald-100",
  "runtime-admitted": "text-red-200",
};

function heroFor(id: string): Hero | undefined {
  return heroById.get(id);
}

function simbadUrl(identifier: string | null): string | null {
  return identifier ? `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${encodeURIComponent(identifier)}` : null;
}

function stateLabel(state: MainlineABetaStellarReviewRowV611["state"]): string {
  return STATE_LABELS[state];
}

function starStyle(hero: Hero): CSSProperties {
  const color = stellarAtlasColor(hero.temperatureK);
  const ratio = Number.isFinite(hero.equatorialPolarRadiusRatio) && hero.equatorialPolarRadiusRatio > 1
    ? Math.min(hero.equatorialPolarRadiusRatio, 1.8)
    : 1;
  return {
    background: `radial-gradient(ellipse at 42% 40%, #fff 0 3%, ${color} 10%, ${color}99 25%, transparent 58%), radial-gradient(ellipse, #09131e 0 62%, #020609 80%)`,
    transform: `scaleY(${(1 / ratio).toFixed(3)})`,
  };
}

function measurement(value: number | null, unit: string, empty: string): string {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? `${value} ${unit}` : empty;
}

function attemptLedgerValue(value: string | number | boolean | null | undefined, empty = "尚未记录"): string {
  if (value === null || value === undefined || value === "") return empty;
  if (typeof value === "boolean") return value ? "是" : "否";
  return String(value);
}

function attemptLedgerTimestamp(value: string | null | undefined): string {
  return value ? value : "尚未开始";
}

function attemptLedgerRedirects(value: readonly string[] | null | undefined): string {
  if (!value || value.length === 0) return "无（尚未收到响应）";
  return value.join(" → ");
}

function SummaryCard({ label, value, tone = "text-slate-200" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded border border-white/10 bg-white/[.03] p-2">
      <span className="block text-[10px] text-slate-500">{label}</span>
      <strong className={`text-lg ${tone}`}>{value}</strong>
    </div>
  );
}

export function CanonicalCoverageFreezeGateV622({ pack = canonicalCoveragePack as unknown as CoveragePackV622 }: { pack?: CoveragePackV622 }) {
  const summary = coverageManifestSummaryV622(pack);
  const counts = {
    stars: coveragePackCountV622(pack, "star"),
    nebulae: coveragePackCountV622(pack, "nebula"),
    constellations: coveragePackCountV622(pack, "constellation"),
  };
  const complete = summary.errors.length === 0;
  const blockers = [
    ...summary.errors,
    `${summary.signoffPending} visual signoffs pending`,
    `${summary.rightsPending} rights reviews pending`,
    "canonical payload freeze not sealed",
    "runtime route and lifecycle observations not-run",
  ];
  return (
    <section className="mt-3 rounded border border-orange-100/15 bg-orange-100/[.025] p-3" data-mainline-a-canonical-freeze-gate="v622" data-mainline-a-canonical-coverage={`${counts.stars}/${counts.constellations}/${counts.nebulae}`} data-mainline-a-canonical-lifecycle="candidate-hold" data-mainline-a-canonical-evidence-class="static" data-mainline-a-canonical-runtime-observed="false">
      <div className="flex items-center justify-between gap-2"><h3 className="text-[10px] uppercase tracking-[.14em] text-slate-500">Canonical coverage / freeze gate · V622</h3><span className="rounded border border-orange-100/15 px-1.5 py-0.5 text-[9px] text-orange-100">{complete ? "静态目录完整 · 冻结待验收" : "静态目录待修复 · 冻结待验收"}</span></div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4" data-mainline-a-canonical-coverage-grid="true">
        <SummaryCard label="恒星目录" value={`${counts.stars}/12`} tone="text-orange-100" />
        <SummaryCard label="星座目录" value={`${counts.constellations}/12`} tone="text-orange-100" />
        <SummaryCard label="星云目录" value={`${counts.nebulae}/12`} tone="text-orange-100" />
        <SummaryCard label="冻结验收" value="pending" tone="text-amber-100" />
      </div>
      <dl className="mt-2 space-y-1 text-[10px] leading-5 text-slate-400">
        <div><dt className="text-slate-500">canonical target</dt><dd data-mainline-a-canonical-target="true">12 恒星 · 12 星座 · 12 星云；仅目录覆盖</dd></div>
        <div><dt className="text-slate-500">pending review</dt><dd data-mainline-a-canonical-pending="true">{summary.pending} 项待补证 · {summary.signoffPending} 项视觉签署 pending · {summary.rightsPending} 项版权审核 pending</dd></div>
        <div><dt className="text-slate-500">lifecycle</dt><dd data-mainline-a-canonical-lifecycle-state="true">candidate-hold · runtime candidate-only · measurement not-admitted</dd></div>
        <div><dt className="text-slate-500">运行时实测</dt><dd>路由访问 not-run · 资源释放 not-run · 应用视觉 not-run</dd></div>
      </dl>
      <ul className="mt-2 space-y-1 text-[10px] text-amber-100/70" data-mainline-a-canonical-blockers="true">{blockers.map((blocker) => <li key={blocker}>· {blocker}</li>)}</ul>
      <div className="mt-2 grid gap-1 sm:grid-cols-3" data-mainline-a-canonical-state-strip="true">
        <span className="rounded border border-amber-100/10 px-2 py-1 text-[9px] text-amber-100/70">static coverage {complete ? "complete" : "invalid"}</span>
        <span className="rounded border border-amber-100/10 px-2 py-1 text-[9px] text-amber-100/70">signoff pending</span>
        <span className="rounded border border-amber-100/10 px-2 py-1 text-[9px] text-amber-100/70">lifecycle candidate-hold</span>
      </div>
      <div className="mt-2 rounded border border-white/[.08] px-2 py-1.5 text-[9px] text-slate-500" data-mainline-a-canonical-next-action="true">下一动作：记录真实路由访问与资源释放，再完成逐项人工视觉签署。版权审核保持 pending。</div>
      <div className="mt-2 grid gap-1 text-[9px] text-slate-500 sm:grid-cols-2" data-mainline-a-canonical-lifecycle-checks="true">
        <span>static catalog · {complete ? "complete" : "invalid"}</span>
        <span>evidence review · pending</span>
        <span>human signoff · required</span>
        <span>runtime promotion · blocked</span>
      </div>
      <p className="mt-2 text-[10px] text-orange-100/60">目录计数不能证明视觉验收、版权批准或资源释放；此面板不会修改 V616 snapshot/projection digest，也不会开启科学载荷写回。</p>
    </section>
  );
}

function HeroCard({
  row,
  hero,
  selected,
  onSelect,
}: {
  row: MainlineABetaStellarReviewRowV611;
  hero: Hero;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-mainline-a-beta-hero-review-record={row.id}
      className={`min-w-0 rounded-lg border p-2 text-left transition-colors ${selected ? "border-sky-100/55 bg-[#14242d]" : "border-white/10 bg-[#09151e] hover:border-slate-500"}`}
    >
      <div className="h-24 w-full rounded border border-white/10" style={starStyle(hero)} aria-hidden="true" />
      <span className="mt-2 block truncate text-xs text-slate-100">{hero.name}</span>
      <span className="mt-1 block truncate font-mono text-[9px] text-slate-500">{row.simbadIdentifier ?? "SIMBAD 标识缺失"} · {row.resolutionClass}</span>
      <span className={`mt-1 block truncate text-[9px] ${STATE_TONES[row.state]}`}>{stateLabel(row.state)}</span>
    </button>
  );
}

function SourceDetails({ row, showSource }: { row: MainlineABetaStellarReviewRowV611; showSource: boolean }) {
  const source = simbadUrl(row.simbadIdentifier);
  if (!showSource) return null;
  return (
    <div className="mt-4 rounded border border-white/10 bg-black/15 p-3 text-[10px] leading-5 text-slate-500">
      <p><span className="font-mono text-sky-100/70">awaiting-snapshot-ingest</span> · 来源：封存 SIMBAD 快照重放；当前仅候选，不是测量准入。</p>
      {source ? <a href={source} target="_blank" rel="noreferrer" className="break-all text-cyan-100/70 underline">{source}</a> : <p className="text-amber-100/70">SIMBAD 链接不可生成：来源标识缺失</p>}
      <ul className="mt-2 space-y-1 text-amber-100/70">
        {row.risks.map((risk) => <li key={risk}>· {reviewRiskLabelV611(risk)}</li>)}
      </ul>
    </div>
  );
}

function ArtEvidenceDetails({ evidence }: { evidence: HeroArtEvidenceRecordV615 }) {
  const checked = Object.values(evidence.checks).filter(Boolean).length;
  const total = Object.keys(evidence.checks).length;
  const tone = heroArtEvidenceStatusToneV615(evidence.artStatus);
  return (
    <section className="mt-4 rounded border border-sky-100/15 bg-sky-100/[.035] p-3 text-xs leading-5" data-mainline-a-beta-hero-art-evidence={evidence.id}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] uppercase tracking-[.14em] text-slate-500">美术证据 / V615</h4>
        <span className={`rounded border border-white/15 px-1.5 py-0.5 text-[9px] ${tone === "positive" ? "text-emerald-100" : tone === "neutral" ? "text-sky-100" : "text-amber-100"}`}>{heroArtEvidenceStatusLabelV615(evidence.artStatus)}</span>
      </div>
      <dl className="mt-2 space-y-1 text-slate-400">
        <div><dt className="text-slate-500">视觉检查</dt><dd>{checked}/{total} 项通过 · {evidence.visualProfile.textureMode}</dd></div>
        <div><dt className="text-slate-500">光球 / 日冕</dt><dd>{evidence.visualProfile.shaderProfile} · {evidence.visualProfile.coronaModel}</dd></div>
        <div><dt className="text-slate-500">准入边界</dt><dd>{evidence.runtimeAdmission} · measurement {evidence.measurementAdmission}</dd></div>
      </dl>
      {evidence.blockers.length > 0 ? <ul className="mt-2 space-y-1 text-amber-100/70">{heroArtEvidenceBlockerLabelsV615(evidence).map((blocker) => <li key={blocker}>· {blocker}</li>)}</ul> : <p className="mt-2 text-emerald-100/70">参数化肖像基线完整；仍不代表观测表面纹理。</p>}
    </section>
  );
}

function SourceClosureDetails({ closure }: { closure: StellarSourceClosureRecordV616 }) {
  const tone = stellarSourceClosureStatusToneV616(closure.status);
  return (
    <section className="mt-4 rounded border border-amber-100/15 bg-amber-100/[.025] p-3 text-xs leading-5" data-mainline-a-beta-stellar-source-closure={closure.id}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] uppercase tracking-[.14em] text-slate-500">来源闭环 / V616</h4>
        <span className={`rounded border border-white/15 px-1.5 py-0.5 text-[9px] ${tone === "warning" ? "text-amber-100" : tone === "neutral" ? "text-sky-100" : "text-emerald-100"}`}>{stellarSourceClosureStatusLabelV616(closure.status)}</span>
      </div>
      <dl className="mt-2 space-y-1 text-slate-400">
        <div><dt className="text-slate-500">SIMBAD 来源页</dt><dd className="break-all text-cyan-100/70"><a href={closure.sourcePageUrl} target="_blank" rel="noreferrer" className="underline">{closure.sourcePageUrl}</a></dd></div>
        <div><dt className="text-slate-500">缺口</dt><dd>{stellarSourceClosureMissingLabelsV616(closure).join("、") || "无"}</dd></div>
        <div><dt className="text-slate-500">下一步</dt><dd>{stellarSourceClosureNextActionV616(closure)}</dd></div>
        <div><dt className="text-slate-500">快照采集</dt><dd>{closure.freshCapture.capturedAt ?? "尚未采集"} · {closure.reviewDecision} · {closure.runtimeAdmission}</dd></div>
      </dl>
      <p className="mt-2 text-[10px] text-amber-100/60">来源页只是采集入口；新快照、审核和组件身份决策完成前，不会打开恒星运行时或测量准入。</p>
    </section>
  );
}

export function StructuredCandidateFieldsV621({ candidate }: { candidate: StructuredCandidateV621 }) {
  const formatValue = (value: number | null | undefined, unit: string) =>
    typeof value === "number" && Number.isFinite(value) ? `${value} ${unit}` : "待解析";
  const labels = { coordinates: "坐标", properMotion: "自行", parallax: "视差", spectralType: "光谱型" };
  const evidence = candidate.fieldEvidence ?? [];
  return (
    <div className="mt-2 rounded border border-cyan-100/10 p-2" data-mainline-a-stellar-field-review={candidate.id}>
      <dl className="grid gap-2 text-[10px] text-slate-400 sm:grid-cols-2">
        <div><dt className="text-slate-500">自行 μRA·cosδ</dt><dd>{formatValue(candidate.properMotionRaMasYr, "mas/yr")}</dd></div>
        <div><dt className="text-slate-500">自行 μDec</dt><dd>{formatValue(candidate.properMotionDecMasYr, "mas/yr")}</dd></div>
        <div><dt className="text-slate-500">视差原值</dt><dd>{formatValue(candidate.parallaxMas, "mas")} · 误差 {formatValue(candidate.parallaxErrorMas, "mas")}</dd></div>
        <div><dt className="text-slate-500">光谱型／质量标记</dt><dd>{candidate.spectralType ?? "待解析"} · {candidate.spectralQuality ?? "未标注"}</dd></div>
      </dl>
      <p className="mt-2 text-[10px] text-amber-100/70">仅为保存页面的字段解析；组件身份仍需独立核对，数值未写回科学载荷。</p>
      {evidence.length > 0 ? <details className="mt-2 text-[10px] text-slate-400">
        <summary className="cursor-pointer text-cyan-100/75">查看 {evidence.length} 项原文字段定位</summary>
        <p className="mt-1 break-all font-mono text-[9px]">raw {candidate.rawPageSha256} · {candidate.sourceArtifactPath}</p>
        <ul className="mt-2 space-y-2">
          {evidence.map((entry) => <li key={entry.field} className="rounded border border-white/10 p-2" data-mainline-a-field-evidence={entry.field}>
            <p>{labels[entry.field]} · UTF-8 bytes [{entry.byteStart}, {entry.byteEnd}) · 质量 {entry.quality ?? "未标注"}</p>
            <p className="break-words text-slate-300">{entry.rawText}</p>
            <p>原始单位 {entry.unit ?? "未标注"} · 引用 {entry.bibcodes.length ? entry.bibcodes.join(" · ") : "未提取"}</p>
          </li>)}
        </ul>
      </details> : <p className="mt-2 text-[10px] text-amber-100/70">原文字段定位未提供；保持待复核。</p>}
    </div>
  );
}

function StructuredCandidateDetails({ candidate, closure }: { candidate: StructuredCandidateV621; closure: StellarSourceClosureRecordV616 }) {
  const normalizedFields = [candidate.queryTitle, candidate.objectType, candidate.spectralType].filter(Boolean).join(" · ") || "未形成结构化字段";
  const blockers = [...candidate.parserWarnings, ...(candidate.componentIdentityStatus === "confirmed" ? [] : ["component-identity"])];
  return (
    <section className="mt-4 rounded border border-emerald-100/15 bg-emerald-100/[.025] p-3 text-xs leading-5" data-mainline-a-beta-stellar-structured-candidate={candidate.id} data-mainline-a-beta-stellar-structured-state={candidate.parseStatus}>
      <div className="flex items-center justify-between gap-2"><h4 className="text-[10px] uppercase tracking-[.14em] text-slate-500">结构化解析与身份台账 / V621</h4><span className="rounded border border-emerald-100/15 px-1.5 py-0.5 text-[9px] text-emerald-100/80">{candidate.parseStatus} · {candidate.decision}</span></div>
      <dl className="mt-2 space-y-1 text-slate-400">
        <div><dt className="text-slate-500">normalized fields</dt><dd>{normalizedFields}</dd></div>
        <div><dt className="text-slate-500">坐标</dt><dd>{candidate.raDeg === null || candidate.decDeg === null ? "待解析" : `${candidate.raDeg.toFixed(5)}°, ${candidate.decDeg.toFixed(5)}°`}</dd></div>
        <div><dt className="text-slate-500">component identity</dt><dd>{candidate.componentIdentityStatus} · {candidate.componentSourceReference ?? "来源引用待补"}</dd></div>
        <div><dt className="text-slate-500">component hints</dt><dd>{candidate.componentHints?.length ?? 0} 条真实 SIMBAD 页面 catalogue 链接；仅身份候选，未确认</dd></div>
        <div><dt className="text-slate-500">source ledger</dt><dd className="break-all text-cyan-100/70">{candidate.sourceLedger.sourceUrl} · {candidate.sourceLedger.capturedAt} · citation {candidate.sourceLedger.citationStatus} · rights {candidate.sourceLedger.rightsStatus}</dd></div>
        <div><dt className="text-slate-500">raw SHA / citation / rights</dt><dd className="break-all font-mono text-[9px]">{candidate.rawPageSha256?.slice(0, 16) ?? "未提供"}… · {closure.projectionRecordDigest?.slice(0, 16) ?? "未提供"}… · ODbL-1.0</dd></div>
        <div><dt className="text-slate-500">准入</dt><dd>{candidate.runtimeAdmission} · {candidate.measurementAdmission} · scientificPayloadWriteback={String(candidate.scientificPayloadWriteback)}</dd></div>
      </dl>
      <StructuredCandidateFieldsV621 candidate={candidate} />
      {candidate.componentHints?.length ? <div className="mt-2 rounded border border-amber-100/10 bg-amber-100/[.02] p-2" data-mainline-a-beta-stellar-component-hints={candidate.id}>
        <p className="text-[10px] uppercase tracking-[.12em] text-slate-500">identity hints / source ledger</p>
        <ul className="mt-1 space-y-1 text-[10px] text-amber-100/70">{candidate.componentHints.map((hint) => <li key={`${hint.catalog}-${hint.identifier}`} className="break-all">· {hint.identifier} · identifier-only · <a href={hint.sourceUrl} target="_blank" rel="noreferrer" className="text-cyan-100/70 underline">{hint.sourceUrl}</a></li>)}</ul>
      </div> : <p className="mt-2 text-[10px] text-amber-100/70">未发现 WDS/CCDM catalogue hint；组件身份保持 unresolved。</p>}
      {blockers.length ? <ul className="mt-2 space-y-1 text-amber-100/70">{blockers.map((blocker) => <li key={blocker}>· 缺口：{blocker}</li>)}</ul> : <p className="mt-2 text-emerald-100/70">结构化字段与组件身份引用齐全，仍需人工 hold 审查。</p>}
      <p className="mt-2 text-[10px] text-emerald-100/60">{structuredCandidateSummaryV621(candidate)} · 结构化候选不等于科学载荷写回。</p>
    </section>
  );
}

function FreshCaptureDetails({ capture }: { capture: StellarFreshCaptureRecordV618 }) {
  return (
    <section className="mt-4 rounded border border-cyan-100/15 bg-cyan-100/[.025] p-3 text-xs leading-5" data-mainline-a-beta-stellar-fresh-capture={capture.request.id} data-mainline-a-beta-stellar-fresh-capture-state={capture.state}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] uppercase tracking-[.14em] text-slate-500">新鲜采集入口 / V618</h4>
        <span className="rounded border border-cyan-100/15 px-1.5 py-0.5 text-[9px] text-cyan-100/80">{freshCaptureStateLabelV618(capture.state)}</span>
      </div>
      <dl className="mt-2 space-y-1 text-slate-400">
        <div><dt className="text-slate-500">请求 ID</dt><dd className="break-all font-mono text-[9px]">{capture.request.requestId}</dd></div>
        <div><dt className="text-slate-500">查询</dt><dd>{capture.request.queryIdentifier}</dd></div>
        <div><dt className="text-slate-500">端点</dt><dd className="break-all text-cyan-100/70">{capture.request.serviceEndpoint}</dd></div>
        <div><dt className="text-slate-500">状态</dt><dd>{freshCaptureRecordSummaryV618(capture)}</dd></div>
      </dl>
      <p className="mt-2 text-[10px] text-amber-100/65">{freshCaptureNextActionV618(capture)} · 原始响应 0/4；{capture.runtimeAdmission} / {capture.measurementAdmission}</p>
      <p className="mt-1 text-[10px] text-slate-500">服务归属：ODbL-1.0 · Wenger et al. 2000 · 仅采集入口，不构成运行时准入</p>
    </section>
  );
}

function RawCaptureDetails({ capture: rawCapture }: { capture: StellarRawCaptureRecordV619 }) {
  const capture = rawCapture as RawCaptureWithAttemptLedger;
  const retryCount = capture.retryCount ?? Math.max(0, capture.attempts - 1);
  return (
    <section className="mt-4 rounded border border-violet-100/15 bg-violet-100/[.025] p-3 text-xs leading-5" data-mainline-a-beta-stellar-raw-capture={capture.plan.id} data-mainline-a-beta-stellar-raw-capture-state={capture.state} data-mainline-a-beta-stellar-raw-attempt-ledger={capture.plan.id}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] uppercase tracking-[.14em] text-slate-500">原始捕获 / V619 · R60 attempt ledger</h4>
        <span className="rounded border border-violet-100/15 px-1.5 py-0.5 text-[9px] text-violet-100/80">{rawCaptureStateLabelV619(capture.state)}</span>
      </div>
      <dl className="mt-2 space-y-1 text-slate-400">
        <div><dt className="text-slate-500">计划 ID</dt><dd className="break-all font-mono text-[9px]">{capture.plan.planId}</dd></div>
        <div><dt className="text-slate-500">传输策略</dt><dd>{rawCaptureTransportLabelV619(capture)}</dd></div>
        <div><dt className="text-slate-500">不可变输入</dt><dd className="font-mono text-[9px]">{rawCaptureImmutableDigestLabelV619(capture)}</dd></div>
        <div><dt className="text-slate-500">状态</dt><dd>{rawCaptureRecordSummaryV619(capture)}</dd></div>
        <div><dt className="text-slate-500">请求开始</dt><dd data-mainline-a-beta-stellar-raw-started-at>{attemptLedgerTimestamp(capture.startedAt)}</dd></div>
        <div><dt className="text-slate-500">请求结束</dt><dd data-mainline-a-beta-stellar-raw-ended-at>{capture.endedAt ?? "尚未结束"}</dd></div>
        <div><dt className="text-slate-500">超时</dt><dd data-mainline-a-beta-stellar-raw-timeout>{attemptLedgerValue(capture.timeout, "未记录")}</dd></div>
        <div><dt className="text-slate-500">重试次数</dt><dd data-mainline-a-beta-stellar-raw-retry-count>{attemptLedgerValue(retryCount, "0")}</dd></div>
        <div><dt className="text-slate-500">HTTP 状态</dt><dd data-mainline-a-beta-stellar-raw-http-status>{attemptLedgerValue(capture.httpStatus, "尚未收到响应")}</dd></div>
        <div><dt className="text-slate-500">内容类型</dt><dd data-mainline-a-beta-stellar-raw-content-type>{attemptLedgerValue(capture.contentType, "尚未收到响应")}</dd></div>
        <div><dt className="text-slate-500">最终 URL</dt><dd className="break-all text-cyan-100/70" data-mainline-a-beta-stellar-raw-final-url>{attemptLedgerValue(capture.finalUrl, "尚未解析")}</dd></div>
        <div><dt className="text-slate-500">重定向链</dt><dd className="break-all" data-mainline-a-beta-stellar-raw-redirect-chain>{attemptLedgerRedirects(capture.redirectChain)}</dd></div>
        <div><dt className="text-slate-500">错误分类</dt><dd className="text-amber-100/75" data-mainline-a-beta-stellar-raw-error-class>{attemptLedgerValue(capture.errorClass, capture.errors.length ? capture.errors.join("、") : "无错误")}</dd></div>
        <div><dt className="text-slate-500">请求 fingerprint</dt><dd className="break-all font-mono text-[9px]" data-mainline-a-beta-stellar-raw-request-fingerprint>{attemptLedgerValue(capture.requestFingerprint, "尚未生成")}</dd></div>
      </dl>
      <p className="mt-2 text-[10px] text-violet-100/65">{rawCaptureNextActionV619(capture)} · raw-only 不等于结构化科学证据。请求明细仅为传输审计，不能打开 candidate-only 边界。</p>
    </section>
  );
}

function RawAttemptLedgerDetails({ record }: { record: StellarRawAttemptRecordV620 }) {
  const latest = record.attempts.at(-1);
  if (!latest) return <section className="mt-4 rounded border border-violet-100/15 bg-violet-100/[.025] p-3 text-xs text-slate-500" data-mainline-a-beta-stellar-raw-attempt-ledger-detail={record.id}>尚未执行 HTTPS attempt。</section>;
  return (
    <section className="mt-4 rounded border border-fuchsia-100/15 bg-fuchsia-100/[.025] p-3 text-xs leading-5" data-mainline-a-beta-stellar-raw-attempt-ledger-detail={record.id}>
      <div className="flex items-center justify-between gap-2"><h4 className="text-[10px] uppercase tracking-[.14em] text-slate-500">R60 attempt ledger / 第 {latest.attempt} 次</h4><span className="rounded border border-fuchsia-100/15 px-1.5 py-0.5 text-[9px] text-fuchsia-100/80">responseCaptured={latest.responseCaptured}</span></div>
      <dl className="mt-2 space-y-1 text-slate-400">
        <div><dt className="text-slate-500">startedAt / endedAt</dt><dd className="font-mono text-[9px]">{latest.startedAt} → {latest.endedAt}</dd></div>
        <div><dt className="text-slate-500">timeout / retry count</dt><dd>{latest.timeoutMs}ms · {latest.retryCount}</dd></div>
        <div><dt className="text-slate-500">HTTP / content type</dt><dd>{latest.httpStatus ?? "—"} · {latest.contentType ?? "—"}</dd></div>
        <div><dt className="text-slate-500">final URL</dt><dd className="break-all text-cyan-100/70">{latest.finalUrl ?? "尚未解析"}</dd></div>
        <div><dt className="text-slate-500">redirect chain</dt><dd className="break-all">{latest.redirectChain.length ? latest.redirectChain.map((hop) => `${hop.from} → ${hop.to} (${hop.status})`).join(" · ") : "无"}</dd></div>
        <div><dt className="text-slate-500">错误分类</dt><dd className="text-amber-100/75">{rawAttemptErrorLabelV620(latest.errorCategory)}{latest.errorMessage ? ` · ${latest.errorMessage}` : ""}</dd></div>
        <div><dt className="text-slate-500">请求 fingerprint</dt><dd className="break-all font-mono text-[9px]">{latest.requestFingerprint}</dd></div>
        <div><dt className="text-slate-500">raw artifact / SHA-256</dt><dd className="break-all font-mono text-[9px]">{latest.rawArtifactPath ?? "未生成"} · {latest.rawArtifactSha256 ?? "未生成"}</dd></div>
      </dl>
      <p className="mt-2 text-[10px] text-fuchsia-100/65">attempt ledger 仅记录 HTTPS 传输事实；raw artifact {latest.rawArtifactPath ?? "未生成"}，科学载荷写回关闭。</p>
    </section>
  );
}

function SelectedHero({ row, hero, showSource, onToggleSource, artEvidence, sourceClosure, capture, rawCapture, rawAttempt, structuredCandidate }: { row: MainlineABetaStellarReviewRowV611; hero: Hero; showSource: boolean; onToggleSource: () => void; artEvidence: HeroArtEvidenceRecordV615; sourceClosure: StellarSourceClosureRecordV616; capture: StellarFreshCaptureRecordV618; rawCapture: StellarRawCaptureRecordV619; rawAttempt: StellarRawAttemptRecordV620; structuredCandidate: StructuredCandidateV621 }) {
  const projection = projectionById.get(row.id);
  return (
    <aside className="min-w-0 border-t border-white/10 bg-[#0a1720] p-4 lg:overflow-y-auto lg:border-l lg:border-t-0" data-mainline-a-beta-hero-review-selected={row.id}>
      <div className="font-mono text-[9px] tracking-[.18em] text-sky-100/50">PENDING HERO / SOURCE GATE</div>
      <h3 className="mt-1 text-base text-sky-50">{hero.name}</h3>
      <p className="mt-1 text-xs text-slate-400">{row.id} · {row.resolutionClass}</p>
      <div className="mt-4 h-40 w-full rounded border border-white/10" style={starStyle(hero)} role="img" aria-label={`${hero.name} 参数化光球预览；不是观测表面`} />
      <div className="mt-4 rounded border border-amber-100/15 bg-amber-100/[.035] p-3 text-xs leading-5 text-amber-50/75">
        <strong className="text-amber-50">状态：{stateLabel(row.state)}</strong>
        <p className="mt-1">当前恒星仍为 evidence-pending，不能写入 A 线恒星运行时。</p>
      </div>
      <dl className="mt-4 space-y-2 text-xs leading-5 text-slate-400">
        <div><dt className="text-slate-500">SIMBAD 标识</dt><dd>{row.simbadIdentifier ?? "未提供"}</dd></div>
        <div><dt className="text-slate-500">参考视差</dt><dd>{measurement(row.parallaxMas, "mas", "未提供正视差")}</dd></div>
        <div><dt className="text-slate-500">误差</dt><dd>{measurement(row.errorMas, "mas", "未提供")}</dd></div>
        <div><dt className="text-slate-500">上游文献</dt><dd>{row.bibcode || "未提供"}</dd></div>
        <div><dt className="text-slate-500">解析类别</dt><dd>{row.resolutionClass}</dd></div>
        <div><dt className="text-slate-500">来源摘要</dt><dd className="break-all font-mono text-[9px]">{row.sourceRecordDigest}</dd></div>
        <div><dt className="text-slate-500">投影状态</dt><dd>{projection?.measurementAdmission ?? "unknown"}</dd></div>
      </dl>
      <ArtEvidenceDetails evidence={artEvidence} />
      <SourceClosureDetails closure={sourceClosure} />
      <FreshCaptureDetails capture={capture} />
      <RawCaptureDetails capture={rawCapture} />
      <RawAttemptLedgerDetails record={rawAttempt} />
      <StructuredCandidateDetails candidate={structuredCandidate} closure={sourceClosure} />
      <MainlineAStellarComponentPanelV634 key={structuredCandidate.id} pack={stellarComponentEvidence as unknown as ComponentEvidencePackV634} selectedId={structuredCandidate.id} />
      <SourceDetails row={row} showSource={showSource} />
      <button type="button" onClick={onToggleSource} className="mt-4 min-h-10 rounded border border-white/15 px-3 text-xs text-slate-300">{showSource ? "隐藏来源详情" : "显示来源详情"}</button>
    </aside>
  );
}

export default function MainlineABetaHeroReviewPanelV611({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const [selectedId, setSelectedId] = useState(pendingRows[0]?.id ?? "acrux");
  const [query, setQuery] = useState("");
  const [showSource, setShowSource] = useState(true);
  const reviewSummary = useMemo(() => summarizeMainlineABetaStellarReviewV611(pendingRows), []);
  const artSummary = useMemo(() => summarizeHeroArtEvidenceV615(artPack), []);
  const filtered = useMemo(() => filterMainlineABetaStellarReviewRowsV611(pendingRows, { query }), [query]);
  const selectedRow = pendingRows.find((row) => row.id === selectedId) ?? filtered[0] ?? pendingRows[0];
  const selectedHero = selectedRow ? heroFor(selectedRow.id) : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => { dialog?.close(); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, []);

  if (!selectedRow || !selectedHero) return null;
  return (
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby={headingId} className="fixed m-auto h-[min(820px,94dvh)] max-h-[94dvh] w-[min(1080px,96vw)] max-w-[96vw] overflow-hidden rounded-xl border border-sky-100/20 bg-[#061019] p-0 text-slate-200 shadow-2xl backdrop:bg-black/75" data-mainline-a-beta-hero-review="true" data-mainline-a-beta-hero-review-schema={MAINLINE_A_BETA_STELLAR_PROJECTION.schema}>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
          <div>
            <div className="font-mono text-[9px] tracking-[.3em] text-sky-100/55">BETA HERO EVIDENCE / V611</div>
            <h2 id={headingId} className="mt-1 text-lg text-sky-50">四颗待补齐恒星 <span className="ml-2 font-mono text-xs text-slate-500">{reviewSummary.total} / {MAINLINE_A_BETA_HERO_COVERAGE.sourceCount} 条证据</span></h2>
            <p className="mt-1 max-w-2xl text-[10px] leading-5 text-slate-400">这些对象已进入 Beta 来源队列，但尚未进入 {MAINLINE_A_BETA_HERO_COVERAGE.runtimeCleared} 颗运行时恒星。身份、视差和上游引用必须先独立复核。</p>
            <p className="mt-1 font-mono text-[9px] text-sky-100/55" data-mainline-a-beta-hero-art-summary="true">美术基线 {artSummary.runtimeBaseline}/{artSummary.total} · candidate-only {artSummary.candidateOnly} · evidence pending {artSummary.evidencePending}</p>
            <p className="mt-1 font-mono text-[9px] text-amber-100/55" data-mainline-a-beta-stellar-source-summary="true">来源闭环 {sourcePack.counts.total} 条 · 缺口 {sourcePack.counts.missingEvidence} 项 · 新快照采集 0/4</p>
            <p className="mt-1 font-mono text-[9px] text-cyan-100/55" data-mainline-a-beta-stellar-fresh-capture-summary="true">V618 {capturePack.counts.responseCaptured}/{capturePack.counts.total} 响应已封存 · {freshCaptureBoundaryLabelV618(capturePack)}</p>
            <p className="mt-1 font-mono text-[9px] text-violet-100/55" data-mainline-a-beta-stellar-raw-capture-summary="true">R60 / V619 {rawCapturePack.counts.captured}/{rawCapturePack.counts.total} 原始响应已捕获 · attempt ledger 已接入 · {rawCaptureBoundaryLabelV619(rawCapturePack)}</p>
            <p className="mt-1 font-mono text-[9px] text-fuchsia-100/55" data-mainline-a-beta-stellar-raw-attempt-summary="true">R60 attempts {rawAttemptLedger.counts.attempted}/{rawAttemptLedger.counts.total} · responseCaptured {rawAttemptLedger.counts.responseCaptured} · failed {rawAttemptLedger.counts.failed} · network evidence only</p>
            <p className="mt-1 font-mono text-[9px] text-emerald-100/55" data-mainline-a-beta-stellar-structured-summary="true">V621 structured {structuredPack.counts.parsedCandidate}/{structuredPack.counts.total} parsed · {structuredPack.counts.blocked} blocked · component confirmed {structuredPack.counts.componentConfirmed} · hold</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭恒星证据审查台" className="min-h-11 rounded border border-white/10 px-3 text-sm hover:bg-white/10">关闭 ×</button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto lg:overflow-hidden">
          <div className="grid min-h-full lg:h-full lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-w-0 p-4 sm:p-6 lg:overflow-y-auto" aria-label="待补齐恒星列表">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-mainline-a-beta-hero-review-summary="true">
                <SummaryCard label="既有运行时恒星" value={MAINLINE_A_BETA_HERO_COVERAGE.runtimeCleared} tone="text-emerald-200" />
                <SummaryCard label="Beta 来源总数" value={MAINLINE_A_BETA_HERO_COVERAGE.sourceCount} />
                <SummaryCard label="待补齐" value={reviewSummary.total} tone="text-amber-100" />
                <SummaryCard label="身份阻塞" value={reviewSummary.identityReview + reviewSummary.blocked} tone="text-orange-100" />
              </div>
              <CanonicalCoverageFreezeGateV622 />
              <MainlineABetaStellarRosterPanelV641 pack={betaStellarRosterV641 as unknown as MainlineABetaStellarRosterPackV641} />
              <MainlineABetaStellarRosterEvidencePanelV642 pack={betaStellarEvidenceV642 as unknown as MainlineABetaStellarEvidencePackV642} />
              <div className="my-3 flex gap-2">
                <input aria-label="搜索待补齐恒星" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID、SIMBAD 标识或阻塞项" className="min-h-10 min-w-0 flex-1 rounded border border-white/15 bg-black/20 px-3 text-xs" />
                <button type="button" onClick={() => setQuery("")} className="min-h-10 rounded border border-white/15 px-3 text-xs text-slate-300">清空</button>
              </div>
              <p role="status" className="mb-2 text-xs text-slate-500">显示 {filtered.length} / {pendingRows.length} 条 · 测量写回关闭</p>
              <div className="grid grid-cols-2 gap-2" data-mainline-a-beta-hero-review-result-count={filtered.length}>
                {filtered.map((row) => { const hero = heroFor(row.id); return hero ? <HeroCard key={row.id} row={row} hero={hero} selected={row.id === selectedRow.id} onSelect={() => setSelectedId(row.id)} /> : null; })}
              </div>
              <section className="mt-4 rounded border border-cyan-100/10 bg-cyan-100/[.02] p-3" data-mainline-a-beta-stellar-fresh-capture-ledger="v618">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[10px] uppercase tracking-[.14em] text-slate-500">V618 采集请求队列</h3>
                  <span className="font-mono text-[9px] text-cyan-100/60">4 required · 0 response</span>
                </div>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {capturePack.records.map((capture) => <button key={capture.request.id} type="button" onClick={() => setSelectedId(capture.request.id)} data-mainline-a-beta-stellar-fresh-capture-row={capture.request.id} className="rounded border border-white/10 bg-black/15 p-2 text-left text-[10px] text-slate-400 hover:border-cyan-100/30"><span className="font-mono text-cyan-100/75">{capture.request.id}</span><span className="ml-2">{freshCaptureStateLabelV618(capture.state)}</span><span className="mt-1 block truncate text-[9px] text-slate-600">{capture.request.requestId}</span></button>)}
                </div>
              </section>
              <section className="mt-3 rounded border border-violet-100/10 bg-violet-100/[.02] p-3" data-mainline-a-beta-stellar-raw-capture-ledger="r60-v619">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[10px] uppercase tracking-[.14em] text-slate-500">R60 HTTPS 原始捕获与 attempt ledger</h3>
                  <span className="font-mono text-[9px] text-violet-100/60">4 pending · raw-only · responseCaptured 0</span>
                </div>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {rawCapturePack.records.map((capture) => {
                    const ledger = capture as RawCaptureWithAttemptLedger;
                    const retryCount = ledger.retryCount ?? Math.max(0, capture.attempts - 1);
                    return <button key={capture.plan.id} type="button" onClick={() => setSelectedId(capture.plan.id)} data-mainline-a-beta-stellar-raw-capture-row={capture.plan.id} className="rounded border border-white/10 bg-black/15 p-2 text-left text-[10px] text-slate-400 hover:border-violet-100/30"><span className="font-mono text-violet-100/75">{capture.plan.id}</span><span className="ml-2">{rawCaptureStateLabelV619(capture.state)}</span><span className="mt-1 block truncate text-[9px] text-slate-600">{rawCaptureTransportLabelV619(capture)}</span><span className="mt-1 block text-[9px] text-violet-100/55">attempts {capture.attempts} · retries {retryCount} · HTTP {ledger.httpStatus ?? "—"}</span></button>;
                  })}
                </div>
              </section>
              <section className="mt-3 rounded border border-emerald-100/10 bg-emerald-100/[.02] p-3" data-mainline-a-beta-stellar-structured-ledger="v621">
                <div className="flex items-center justify-between gap-2"><h3 className="text-[10px] uppercase tracking-[.14em] text-slate-500">V621 结构化解析与 source/component identity</h3><span className="font-mono text-[9px] text-emerald-100/60">{structuredPack.counts.parsedCandidate} parsed · {structuredPack.counts.blocked} blocked · hold</span></div>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">{structuredPack.records.map((candidate) => <button key={candidate.id} type="button" onClick={() => setSelectedId(candidate.id)} data-mainline-a-beta-stellar-structured-row={candidate.id} className="rounded border border-white/10 bg-black/15 p-2 text-left text-[10px] text-slate-400 hover:border-emerald-100/30"><span className="font-mono text-emerald-100/75">{candidate.id}</span><span className="ml-2">{candidate.parseStatus}</span><span className="mt-1 block truncate text-[9px] text-slate-600">component {candidate.componentIdentityStatus} · hints {candidate.componentHints?.length ?? 0} · {candidate.decision} · {candidate.runtimeAdmission}</span></button>)}</div>
              </section>
              {!filtered.length ? <p className="py-8 text-center text-sm text-slate-400">没有匹配的待补齐恒星。</p> : null}
            </section>
            <SelectedHero row={selectedRow} hero={selectedHero} artEvidence={artEvidenceById.get(selectedRow.id) ?? artPack.records[0]} sourceClosure={sourceClosureById.get(selectedRow.id) ?? sourcePack.records[0]} capture={captureById.get(selectedRow.id) ?? capturePack.records[0]} rawCapture={rawCaptureById.get(selectedRow.id) ?? rawCapturePack.records[0]} rawAttempt={rawAttemptById.get(selectedRow.id) ?? rawAttemptLedger.records[0]} structuredCandidate={structuredById.get(selectedRow.id) ?? structuredPack.records[0]} showSource={showSource} onToggleSource={() => setShowSource((value) => !value)} />
          </div>
        </div>
      </div>
    </dialog>
  );
}
