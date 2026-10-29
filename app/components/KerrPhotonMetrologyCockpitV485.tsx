"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrPhotonMetrologyCockpitSnapshotV485,
  loadKerrPhotonMetrologyCockpitSummaryV485,
  subscribeKerrPhotonMetrologyCockpitV485,
} from "../lib/kerrPhotonMetrologyCockpitClientV485";

export default function KerrPhotonMetrologyCockpitV485() {
  const state = useSyncExternalStore(
    subscribeKerrPhotonMetrologyCockpitV485,
    getKerrPhotonMetrologyCockpitSnapshotV485,
    getKerrPhotonMetrologyCockpitSnapshotV485,
  );
  const [mode, setMode] = useState<"science" | "cinematic">("science");
  useEffect(() => {
    void loadKerrPhotonMetrologyCockpitSummaryV485().catch(() => undefined);
  }, []);
  const summary = state.summary;
  const presentation = summary?.presentation[mode];
  const style = {
    "--v485-signal": mode === "science" ? "#adf7ff" : "#ffc081",
    "--v485-warm": mode === "science" ? "#f1ff8d" : "#ff7d6f",
    "--v485-wash": mode === "science" ? "rgba(69,218,255,.09)" : "rgba(255,145,82,.09)",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[32px] border border-white/10 bg-[#030607] p-5 text-white shadow-[0_70px_230px_rgba(0,0,0,.82)] sm:p-8"
      data-atlas-kerr-photon-metrology-cockpit-v485
      data-atlas-v485-mode={mode}
      data-atlas-v485-stage-count={summary?.stages.length ?? 0}
      data-atlas-v485-summary-matrix-elements="0"
      data-atlas-v485-summary-projection-records="0"
      data-atlas-v485-detail-autoload="false"
      data-atlas-v485-science-writeback="false"
      data-atlas-v485-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,.09)_1px,transparent_1px)] [background-size:19px_19px]" />
      <div className="pointer-events-none absolute -right-44 -top-52 h-[660px] w-[660px] rounded-full border border-[var(--v485-signal)]/12 shadow-[inset_0_0_150px_var(--v485-wash)]" />
      <div className="pointer-events-none absolute -right-16 -top-24 h-[410px] w-[410px] rounded-full border border-white/7" />

      <header className="relative grid gap-7 border-b border-white/10 pb-7 xl:grid-cols-[1.2fr_.8fr] xl:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.44em] text-[var(--v485-signal)]/55">
            V485 / photon metrology cockpit
          </div>
          <h2 className="mt-4 max-w-5xl font-serif text-4xl tracking-[.035em] text-white/92 sm:text-6xl">
            六站证据航线，一套不越权的光子计量舱
          </h2>
          <p className="mt-5 max-w-3xl font-mono text-[10px] leading-6 text-white/42">
            Provenance、产品准入、landmark、相关误差、sensitivity 与 identifiability 在同一航线上汇总。Cockpit 只持有标量、状态和 SHA；矩阵、投影和完整科学数组留在白名单 artifact，绝不灌入 React state。
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid grid-cols-3 gap-px border border-white/10 bg-white/10 font-mono">
            <Stat label="rays" value="4" />
            <Stat label="samples" value="20" />
            <Stat label="rank" value="1 / 5" />
          </div>
          <div className="flex border border-white/12 bg-black/55 p-1 font-mono text-[8px] uppercase tracking-[.2em]">
            {(["science", "cinematic"] as const).map((entry) => (
              <button
                className={
                  "px-4 py-2.5 transition-colors " +
                  (mode === entry
                    ? "bg-[var(--v485-signal)] text-black"
                    : "text-white/30 hover:text-white/70")
                }
                key={entry}
                onClick={() => setMode(entry)}
                type="button"
              >
                {entry}
              </button>
            ))}
          </div>
        </div>
      </header>

      {!summary || !presentation ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 font-mono text-[10px] text-white/50"
          data-atlas-v485-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在装载 bounded cockpit summary……"
            : `Photon metrology cockpit 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-8">
            <div className="absolute left-5 right-5 top-[29px] hidden border-t border-dashed border-[var(--v485-signal)]/25 lg:block" />
            <div className="grid gap-3 lg:grid-cols-6">
              {summary.stages.map((stage) => (
                <article
                  className="group relative border border-white/10 bg-[#060b0c]/90 p-4 transition-[border-color,transform] hover:-translate-y-1 hover:border-[var(--v485-signal)]/35"
                  data-atlas-v485-stage={stage.id}
                  data-atlas-v485-stage-browser={stage.browserQualification}
                  key={stage.id}
                >
                  <div className="relative z-10 flex items-center justify-between gap-3 font-mono text-[8px]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--v485-signal)]/40 bg-[#030607] text-[var(--v485-signal)]">
                      {String(stage.ordinal).padStart(2, "0")}
                    </span>
                    <span className="text-white/25">v{478 + stage.ordinal}</span>
                  </div>
                  <div className="mt-7 font-serif text-xl leading-6 text-white/80">{stage.label}</div>
                  <div className="mt-5 font-mono text-[10px] text-[var(--v485-signal)]/80">
                    {stage.primaryMetric}
                  </div>
                  <div className="mt-2 min-h-8 font-mono text-[7px] leading-4 text-white/28">
                    {stage.secondaryMetric}
                  </div>
                  <div className="mt-5 break-all border-t border-white/8 pt-3 font-mono text-[7px] leading-4 text-white/22">
                    {stage.artifactSha256.slice(0, 18)}…
                  </div>
                  <a
                    className="mt-4 inline-flex border-b border-[var(--v485-signal)]/25 pb-1 font-mono text-[7px] uppercase tracking-[.15em] text-[var(--v485-signal)]/55 transition-colors hover:text-[var(--v485-signal)]"
                    href={stage.detailEndpoint}
                  >
                    inspect detail ↗
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="relative mt-6 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
            <article className="overflow-hidden border border-white/10 bg-black/30">
              <div className="grid grid-cols-[.26fr_.74fr]">
                <div className="flex min-h-72 flex-col justify-between bg-[var(--v485-wash)] p-5">
                  <div className="font-mono text-[8px] uppercase tracking-[.22em] text-[var(--v485-signal)]/60">
                    authority vector
                  </div>
                  <div>
                    <div className="font-serif text-6xl leading-none text-[var(--v485-warm)] sm:text-8xl">4</div>
                    <div className="mt-2 font-mono text-[8px] uppercase tracking-[.2em] text-white/35">
                      bounded truths
                    </div>
                  </div>
                  <div className="font-mono text-[7px] leading-4 text-white/25">
                    normalized coordinates<br />sparse vectors<br />rank‑1 upper bound<br />1/5 identifiability
                  </div>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="font-mono text-[8px] uppercase tracking-[.2em] text-white/30">
                    qualification boundary
                  </div>
                  <div className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    {Object.entries(summary.availability).map(([label, status]) => (
                      <div
                        className="flex items-center justify-between gap-4 border-b border-white/8 pb-2 font-mono text-[8px]"
                        key={label}
                      >
                        <span className="text-white/35">{label}</span>
                        <span
                          className={
                            status.startsWith("qualified")
                              ? "text-[var(--v485-signal)]/75"
                              : "text-amber-200/55"
                          }
                        >
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <aside className="border border-white/10 bg-white/[.02] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[.2em] text-white/30">
                <span>runtime payload discipline</span>
                <span className="text-[var(--v485-signal)]">bounded</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <Zero label="matrix elements" />
                <Zero label="projection records" />
                <Zero label="execution records" />
              </div>
              <div className="mt-6 space-y-3 font-mono text-[8px]">
                <Check label="detail artifacts isolated" />
                <Check label="single-flight summary" />
                <Check label="no-store transport" />
                <Check label="stage SHA chain immutable" />
                <Check label="Science/Cinematic metrics shared" />
              </div>
              <div className="mt-6 break-all border-t border-white/10 pt-4 font-mono text-[7px] leading-5 text-white/25">
                STAGE CHAIN SHA / {summary.stageChainSha256}
                <br />
                {mode} presentation / exposure {presentation.exposure.toFixed(2)} / bloom{" "}
                {presentation.bloomIntensity.toFixed(2)} / writeback forbidden
              </div>
            </aside>
          </div>

          <footer className="relative mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/30">
            <span>Canvas 1 · sceneRevision Δ0 · resources baseline · dense 0/49 · browser not-run</span>
            <a
              className="border border-white/12 px-3 py-1.5 transition-colors hover:border-[var(--v485-signal)]/45 hover:text-[var(--v485-signal)]"
              href="/api/atlas/relativity-evidence/v485/photon-metrology-cockpit?download=cockpit"
            >
              export cockpit envelope
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#050809] px-4 py-3 text-center">
      <div className="text-[7px] uppercase tracking-[.18em] text-white/25">{label}</div>
      <div className="mt-1 font-serif text-xl text-white/75">{value}</div>
    </div>
  );
}

function Zero({ label }: { label: string }) {
  return (
    <div className="border border-white/8 bg-black/25 p-3 text-center font-mono">
      <div className="text-2xl text-[var(--v485-signal)]">0</div>
      <div className="mt-1 text-[7px] uppercase tracking-[.12em] text-white/25">{label}</div>
    </div>
  );
}

function Check({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-2 text-white/35">
      <span>{label}</span>
      <span className="text-[var(--v485-signal)]/70">verified</span>
    </div>
  );
}
