"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  getKerrHighEnergyResponseAcquisitionSnapshotV427,
  loadKerrHighEnergyResponseAcquisitionSummaryV427,
  subscribeKerrHighEnergyResponseAcquisitionV427,
} from "../lib/kerrHighEnergyResponseAcquisitionPackClientV427";

const EXPORTS = [
  ["PACK JSON", "json", "Schema、validator 与 authority 边界"],
  ["EMPTY PACK ZIP", "zip", "9 个确定性文件；7 个测量模板均为零数据行"],
  ["PLAN FITS", "fits", "12 项采集计划；不含测量响应"],
  ["ARCHITECTURE PNG", "png", "采集与资格防火墙图；不是探测器图像"],
] as const;

const STAGES = [
  ["01", "IDENTITY", "仪器、campaign、UTC、实验室与实测声明"],
  ["02", "ACQUIRE", "面积、调制、重分布、背景的重复采集"],
  ["03", "COVARIANCE", "24×24 响应与逐能段 simplex 协方差"],
  ["04", "PROVENANCE", "原始文件、处理参数、条款与 SHA-256"],
  ["05", "VALIDATE", "结构门禁之后仍需独立科研验证"],
] as const;

export default function KerrHighEnergyResponseAcquisitionV427() {
  const state = useSyncExternalStore(
    subscribeKerrHighEnergyResponseAcquisitionV427,
    getKerrHighEnergyResponseAcquisitionSnapshotV427,
    getKerrHighEnergyResponseAcquisitionSnapshotV427,
  );
  useEffect(() => { void loadKerrHighEnergyResponseAcquisitionSummaryV427().catch(() => undefined); }, []);
  const summary = state.summary;
  const metrics = summary?.validator.fixtureMetrics;
  return (
    <section
      className="relative mt-3 overflow-hidden border border-cyan-100/15 bg-[linear-gradient(120deg,rgba(2,9,12,.995),rgba(2,13,16,.99)_58%,rgba(11,8,2,.985))] p-3 font-mono text-white/52 shadow-[inset_0_1px_0_rgba(207,250,254,.035),0_24px_80px_rgba(0,0,0,.2)]"
      data-atlas-kerr-high-energy-response-acquisition-v427
      data-atlas-v427-status={state.status}
      data-atlas-v427-measurement-template-rows="0"
      data-atlas-v427-measured-response-authority="false"
      data-atlas-v427-science-response-applications="0"
      data-atlas-v427-summary-only-in-react-state="true"
      data-atlas-v427-canvas-created="false"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(103,232,249,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,.025)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-cyan-100/10 shadow-[inset_0_0_70px_rgba(34,211,238,.035)]" />
      <header className="relative grid gap-3 border-b border-white/7 pb-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-[6px] uppercase tracking-[.34em] text-cyan-100/42">V427 · experimental response hand-off</div>
          <h4 className="mt-1 font-['Bahnschrift_Condensed','DIN_Condensed',sans-serif] text-[21px] font-light uppercase tracking-[.18em] text-cyan-50/92">Response acquisition clean room</h4>
          <p className="mt-1 max-w-[115ch] text-[6px] leading-relaxed text-white/38">把 v426 合同转换为实验团队可填写的空白采集包。模板不含示例性能值；validator 可验证覆盖、重复、单位、SHA、重分布归一化及协方差，但永远不能自行签发实测科研权威。</p>
        </div>
        <div className="flex items-center gap-2 self-start border border-cyan-100/14 bg-cyan-100/[.025] px-2.5 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${state.status === "ready" ? "bg-lime-200/75 shadow-[0_0_14px_rgba(190,242,100,.3)]" : state.status === "loading" ? "animate-pulse bg-amber-200/65" : "bg-rose-200/65"}`} />
          <div><div className="text-[5px] uppercase tracking-[.12em] text-white/22">pack channel</div><div className="mt-0.5 text-[6px] uppercase text-cyan-100/62">{state.status}</div></div>
        </div>
      </header>

      {!summary ? (
        <div className="relative mt-3 border-l-2 border-cyan-100/24 bg-cyan-100/[.02] px-3 py-2 text-[6px] text-cyan-50/48">
          {state.status === "loading" || state.status === "idle" ? "正在读取空白响应采集包…" : `响应采集包不可用 · ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_300px]">
            <div className="grid gap-3">
              <div className="grid gap-px bg-white/6 md:grid-cols-5">
                {STAGES.map(([index, title, detail]) => (
                  <article key={index} className="relative min-h-28 bg-black/42 p-2.5">
                    <div className="flex items-center justify-between"><span className="text-[7px] text-cyan-100/62">{index}</span><span className="text-[5px] text-amber-100/42">NOT RUN</span></div>
                    <div className="mt-4 text-[7px] tracking-[.1em] text-cyan-50/62">{title}</div>
                    <p className="mt-1 text-[5px] leading-relaxed text-white/27">{detail}</p>
                  </article>
                ))}
              </div>
              <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
                <div className="border border-cyan-100/10 bg-black/28 p-3">
                  <div className="flex items-center justify-between"><span className="text-[5px] uppercase tracking-[.16em] text-cyan-100/38">Fail-closed validator</span><span className="text-[5px] text-lime-100/45">12 / 12 corruptions rejected</span></div>
                  <div className="mt-3 grid gap-px bg-white/6 sm:grid-cols-2">
                    {["完整能段与 channel 覆盖", "重复索引与唯一测量 ID", "有限值、单位、温度与曝光", "逐行重分布概率和为 1", "24×24 对称 PSD 响应协方差", "逐能段 PSD simplex 协方差", "dead-time / pileup 声明", "原始文件与处理 SHA"].map((label) => <div key={label} className="bg-black/38 px-2 py-1.5 text-[5px] text-cyan-50/42"><span className="mr-2 text-lime-100/58">◇</span>{label}</div>)}
                  </div>
                </div>
                <div className="border border-amber-100/12 bg-amber-100/[.025] p-3">
                  <div className="text-[5px] uppercase tracking-[.16em] text-amber-100/42">Authority firewall</div>
                  <div className="mt-3 space-y-2 text-[6px]">
                    <Rail label="pack / schema" value="QUALIFIED" tone="lime" />
                    <Rail label="validator fixture" value="NONPUBLISHABLE" tone="cyan" />
                    <Rail label="measured rows" value="0" tone="amber" />
                    <Rail label="measured response" value="UNAVAILABLE" tone="rose" />
                    <Rail label="science application" value="0" tone="rose" />
                  </div>
                </div>
              </div>
            </div>
            <aside className="grid content-start gap-px bg-white/6 sm:grid-cols-2 xl:grid-cols-1">
              <Metric label="pack files" value={`${summary.counts.packFileCount}`} tone="cyan" />
              <Metric label="empty templates" value={`${summary.counts.measurementTemplateCount} · 0 rows`} tone="lime" />
              <Metric label="acquisition tasks" value={`${summary.counts.acquisitionPlanTaskCount}`} tone="cyan" />
              <Metric label="fixture rows" value={`${summary.counts.validatorFixtureDataRowCount} · test only`} tone="amber" />
              <Metric label="redistribution Δ" value={metrics?.maximumRedistributionRowSumAbsolute.toExponential(1) ?? "—"} tone="lime" />
              <Metric label="simplex covariance Δ" value={metrics?.maximumRedistributionCovarianceSimplexResidual.toExponential(2) ?? "—"} tone="lime" />
              <Metric label="dense campaign" value={summary.denseCampaignStatus.replace("incomplete-", "")} tone="amber" />
              <Metric label="browser" value="NOT RUN" tone="amber" />
            </aside>
          </div>
          <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-2 lg:grid-cols-4">
            {EXPORTS.map(([label, format, detail]) => (
              <a key={format} href={`/api/atlas/relativity-evidence/v427/high-energy-response-acquisition?download=${format}`} download className="atlas-accessible-focus bg-black/42 px-2.5 py-2 transition-colors hover:bg-cyan-100/[.05]">
                <div className="text-[7px] text-cyan-100/62">{label}</div>
                <div className="mt-0.5 text-[5px] leading-relaxed text-white/26">{detail}</div>
              </a>
            ))}
          </div>
          <footer className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] text-white/28">
            <span>empty templates · deterministic ZIP · validator fixture isolated</span>
            <span className="text-amber-100/45">measured response / counts / pixels / dense authority unavailable</span>
          </footer>
        </>
      )}
    </section>
  );
}

function Rail({ label, value, tone }: Readonly<{ label: string; value: string; tone: "lime" | "cyan" | "amber" | "rose" }>) {
  const color = tone === "lime" ? "text-lime-100/60" : tone === "cyan" ? "text-cyan-100/60" : tone === "amber" ? "text-amber-100/58" : "text-rose-100/58";
  return <div className="flex items-center justify-between gap-3 border-b border-white/6 pb-1"><span className="text-white/27">{label}</span><span className={color}>{value}</span></div>;
}

function Metric({ label, value, tone }: Readonly<{ label: string; value: string; tone: "cyan" | "lime" | "amber" }>) {
  const color = tone === "cyan" ? "text-cyan-100/58" : tone === "lime" ? "text-lime-100/58" : "text-amber-100/58";
  return <div className="bg-black/42 px-2.5 py-2"><div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div><div className={`mt-0.5 text-[7px] ${color}`}>{value}</div></div>;
}
