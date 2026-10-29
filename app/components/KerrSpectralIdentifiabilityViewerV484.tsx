"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrSpectralIdentifiabilitySnapshotV484,
  loadKerrSpectralIdentifiabilitySummaryV484,
  subscribeKerrSpectralIdentifiabilityV484,
} from "../lib/kerrSpectralIdentifiabilityClientV484";

export default function KerrSpectralIdentifiabilityViewerV484() {
  const state = useSyncExternalStore(
    subscribeKerrSpectralIdentifiabilityV484,
    getKerrSpectralIdentifiabilitySnapshotV484,
    getKerrSpectralIdentifiabilitySnapshotV484,
  );
  const [mode, setMode] = useState<"science" | "cinematic">("science");
  useEffect(() => {
    void loadKerrSpectralIdentifiabilitySummaryV484().catch(() => undefined);
  }, []);
  const summary = state.summary;
  const presentation = summary?.presentation[mode];
  const style = {
    "--v484-live": mode === "science" ? "#d8ff62" : "#ffb36c",
    "--v484-dead": mode === "science" ? "#ff7d68" : "#ff7f9c",
    "--v484-wash": mode === "science" ? "rgba(216,255,98,.08)" : "rgba(255,179,108,.08)",
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden border-y border-white/15 bg-[#080806] px-4 py-7 text-white shadow-[0_80px_240px_rgba(0,0,0,.82)] sm:px-8 sm:py-10"
      data-atlas-kerr-spectral-identifiability-v484
      data-atlas-v484-mode={mode}
      data-atlas-v484-identifiable-dimension="1"
      data-atlas-v484-unidentifiable-dimension="4"
      data-atlas-v484-payload-shared={summary?.presentation.sharedIdentifiabilityPayloadIdentity ?? false}
      data-atlas-v484-science-writeback="false"
      data-atlas-v484-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(135deg,transparent_0,transparent_18px,rgba(255,255,255,.045)_19px,transparent_20px)]" />
      <header className="relative grid gap-7 border-b border-white/12 pb-7 xl:grid-cols-[auto_1fr_auto] xl:items-end">
        <div className="font-serif text-[92px] leading-[.72] tracking-[-.08em] text-[var(--v484-live)] sm:text-[138px]">
          1<span className="text-white/16">/5</span>
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.42em] text-white/30">
            V484 / algebraic identifiability ledger
          </div>
          <h2 className="mt-3 max-w-4xl font-serif text-3xl tracking-[.035em] text-white/90 sm:text-5xl">
            可辨识的只有一维，剩余四维必须承认沉默
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-white/42">
            Moore–Penrose 伪逆通过四条 Penrose 条件，但它只是 rank‑1 上界矩阵的代数对象。它不是 inverse-noise covariance，不提供 Fisher information、likelihood 或 posterior。
          </p>
        </div>
        <div className="flex border border-white/12 bg-black/55 p-1 font-mono text-[8px] uppercase tracking-[.2em]">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={
                "px-4 py-2.5 transition-colors " +
                (mode === entry
                  ? "bg-[var(--v484-live)] text-black"
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
      </header>

      {!summary || !presentation ? (
        <div
          className="relative mt-6 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 font-mono text-[10px] text-white/50"
          data-atlas-v484-load-state={state.status}
        >
          {state.status === "idle" || state.status === "loading"
            ? "正在核验 Moore–Penrose 条件……"
            : `Identifiability evidence 不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-7 grid grid-cols-5 gap-1">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                className={
                  "min-h-36 border p-4 font-mono sm:min-h-44 " +
                  (index === 0
                    ? "border-[var(--v484-live)]/45 bg-[var(--v484-wash)]"
                    : "border-[var(--v484-dead)]/18 bg-[var(--v484-dead)]/[.025]")
                }
                data-atlas-v484-dimension={index}
                data-atlas-v484-dimension-status={index === 0 ? "identifiable" : "unidentifiable"}
                key={index}
              >
                <div className="text-[8px] uppercase tracking-[.2em] text-white/25">dimension 0{index + 1}</div>
                <div
                  className={
                    "mt-9 font-serif text-2xl sm:text-4xl " +
                    (index === 0 ? "text-[var(--v484-live)]" : "text-[var(--v484-dead)]/55")
                  }
                >
                  {index === 0 ? "VISIBLE" : "SILENT"}
                </div>
                <div className="mt-3 text-[7px] leading-4 text-white/28">
                  {index === 0 ? "rank-1 common-scale subspace" : "unidentifiable under present model"}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
            <article className="border border-white/10 bg-black/30 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[.2em] text-white/30">
                <span>Penrose conditions / four rays</span>
                <span className="text-[var(--v484-live)]">16 / 16</span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Audit label="C C⁺ C = C" value={summary.audit.maximumPenroseRelativeResidual} />
                <Audit label="C⁺ C C⁺ = C⁺" value={summary.audit.maximumPenroseRelativeResidual} />
                <Audit label="(C C⁺)ᵀ = C C⁺" value={summary.audit.maximumPenroseSymmetryAbsoluteResidual} />
                <Audit label="(C⁺ C)ᵀ = C⁺ C" value={summary.audit.maximumPenroseSymmetryAbsoluteResidual} />
              </div>
              <div className="mt-5 grid gap-2 border-t border-white/10 pt-5 font-mono text-[8px] sm:grid-cols-3">
                <Metric label="projector idempotence" value={summary.audit.maximumProjectorIdempotenceRelativeResidual} />
                <Metric label="P + N − I" value={summary.audit.maximumProjectorComplementAbsoluteResidual} />
                <Metric label="P · N" value={summary.audit.maximumProjectorOrthogonalityAbsoluteResidual} />
              </div>
            </article>

            <aside className="border border-white/10 bg-white/[.02] p-5 sm:p-6">
              <div className="font-mono text-[8px] uppercase tracking-[.2em] text-white/30">
                singular spectrum ledger
              </div>
              <div className="mt-5 grid grid-cols-[1fr_auto] gap-y-3 border-y border-white/10 py-4 font-mono text-[9px]">
                <span className="text-white/35">rank</span><span className="text-[var(--v484-live)]">1</span>
                <span className="text-white/35">nullity</span><span className="text-[var(--v484-dead)]">4</span>
                <span className="text-white/35">determinant</span><span className="text-white/65">0</span>
                <span className="text-white/35">full condition number</span><span className="text-[var(--v484-dead)]">∞ / singular</span>
                <span className="text-white/35">nonzero spectrum κ</span><span className="text-white/65">1</span>
              </div>
              <div className="mt-5 font-mono text-[8px] leading-5 text-white/35">
                {mode} presentation / exposure {presentation.exposure.toFixed(2)} / bloom{" "}
                {presentation.bloomIntensity.toFixed(2)}. Identifiability payload remains shared and immutable.
              </div>
            </aside>
          </div>

          <div className="relative mt-5 grid gap-2 border border-[var(--v484-dead)]/15 bg-[var(--v484-dead)]/[.025] p-4 font-mono text-[8px] sm:grid-cols-5">
            <Boundary label="inverse-noise covariance" />
            <Boundary label="Fisher information" />
            <Boundary label="statistical likelihood" />
            <Boundary label="parameter posterior" />
            <Boundary label="detector response" />
          </div>

          <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[.14em] text-white/30">
            <span>algebraic pseudoinverse ≠ inverse-noise covariance · pixels 0 · dense 0/49</span>
            <a
              className="border border-white/12 px-3 py-1.5 transition-colors hover:border-[var(--v484-live)]/45 hover:text-[var(--v484-live)]"
              href="/api/atlas/relativity-evidence/v484/spectral-identifiability?download=identifiability"
            >
              export identifiability ledger
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Audit({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/8 py-2 font-mono text-[8px]">
      <span className="text-white/35">{label}</span>
      <span className="text-[var(--v484-live)]">{value.toExponential(2)}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-l border-white/10 pl-3">
      <div className="text-[7px] uppercase tracking-[.12em] text-white/25">{label}</div>
      <div className="mt-1 text-[9px] text-white/65">{value.toExponential(2)}</div>
    </div>
  );
}

function Boundary({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--v484-dead)]/10 pb-2 text-white/35">
      <span>{label}</span>
      <span className="text-[var(--v484-dead)]/70">blocked</span>
    </div>
  );
}
