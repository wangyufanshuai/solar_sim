"use client";

import type { KerrScienceBandHudModelV322 } from "../lib/kerrScienceBandHudV322";
import type { KerrScienceProfileABComparisonV324 } from "../lib/kerrScienceProfileABV324";

export const KERR_SCIENCE_OBSERVATORY_VISUAL_VERSION_V333 = "v333-kerr-science-observatory-precision-console-v1" as const;

export type KerrScienceObservatoryVisualContractV333 = Readonly<{
  visualDirection: "deep-space-precision-instrument";
  informationLayer: "telemetry-only-no-science-mutation";
  spectralRail: readonly ["visible", "euv", "soft-x-ray"];
  scienceDisplay: "linear-no-grade";
  cinematicBoundary: "presentation-copy-disjoint";
  denseBoundary: "incomplete-0-of-49";
}>;

export const KERR_SCIENCE_OBSERVATORY_VISUAL_CONTRACT_V333: KerrScienceObservatoryVisualContractV333 = Object.freeze({
  visualDirection: "deep-space-precision-instrument",
  informationLayer: "telemetry-only-no-science-mutation",
  spectralRail: Object.freeze(["visible", "euv", "soft-x-ray"]) as readonly ["visible", "euv", "soft-x-ray"],
  scienceDisplay: "linear-no-grade",
  cinematicBoundary: "presentation-copy-disjoint",
  denseBoundary: "incomplete-0-of-49",
});

const BANDS = Object.freeze([
  Object.freeze({ id: "visible", range: "400–700 nm", rail: "from-amber-200/80 via-emerald-200/70 to-sky-300/80" }),
  Object.freeze({ id: "EUV", range: "10–121 nm", rail: "from-cyan-200/55 via-blue-300/75 to-indigo-300/80" }),
  Object.freeze({ id: "soft X-ray", range: "0.1–2.0 keV", rail: "from-indigo-300/55 via-fuchsia-300/75 to-rose-300/80" }),
]);

function digest(value: string | null): string {
  return value == null ? "unavailable" : `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export default function KerrScienceObservatoryHeaderV333({
  model,
  profileAB,
  onDownload,
}: {
  readonly model: KerrScienceBandHudModelV322;
  readonly profileAB: KerrScienceProfileABComparisonV324;
  readonly onDownload: (kind: "json" | "csv") => void;
}) {
  const ready = model.status === "ready";
  return (
    <header
      className="relative isolate overflow-hidden rounded-[10px] border border-cyan-100/15 bg-[linear-gradient(145deg,rgba(5,18,27,0.97),rgba(4,9,17,0.98)_62%,rgba(9,18,28,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.055)]"
      data-kerr-science-observatory-header-v333={ready ? "ready" : "pending"}
      data-kerr-science-observatory-visual-direction="deep-space-precision-instrument"
      data-kerr-science-observatory-science-display="linear-no-grade"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_5%,rgba(87,214,255,0.1),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(245,185,85,0.06),transparent_24%),linear-gradient(90deg,transparent_49.7%,rgba(148,220,255,0.025)_50%,transparent_50.3%)]" />
      <div aria-hidden="true" className="h-px w-full bg-[linear-gradient(90deg,transparent,rgba(144,225,255,0.65)_22%,rgba(255,211,137,0.55)_58%,transparent)]" />

      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.24em] text-cyan-100/38">
              <span>Orbit Atlas</span><span className="h-px w-5 bg-cyan-100/20" /><span>Observatory Σ</span>
            </div>
            <h3 className="mt-1 font-serif text-[15px] tracking-[0.045em] text-cyan-50/92">Kerr photon observatory</h3>
            <p className="mt-0.5 max-w-[34rem] font-mono text-[7px] leading-relaxed text-white/34">
              Sparse CPU authority · fixed physical normalization · measurement buffers isolated from presentation
            </p>
          </div>
          <div className="shrink-0 text-right" aria-live="polite">
            <span className={ready
              ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-200/25 bg-emerald-200/[0.075] px-2 py-1 font-mono text-[8px] text-emerald-100/82"
              : "inline-flex items-center gap-1.5 rounded-full border border-amber-200/25 bg-amber-200/[0.075] px-2 py-1 font-mono text-[8px] text-amber-100/78"}>
              <span className={ready ? "h-1.5 w-1.5 rounded-full bg-emerald-200 shadow-[0_0_10px_rgba(167,243,208,0.65)]" : "h-1.5 w-1.5 rounded-full bg-amber-200"} />
              {ready ? "CPU float64 authority" : "Awaiting authority"}
            </span>
            <div className="mt-1 font-mono text-[6px] uppercase tracking-[0.16em] text-white/24">browser qualification not run</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5" aria-label="Fixed scientific observing bands">
          {BANDS.map((band) => (
            <div key={band.id} className="group rounded border border-white/[0.065] bg-black/20 px-2 py-1.5">
              <div className="flex items-center justify-between gap-2 font-mono">
                <span className="text-[7px] uppercase tracking-[0.14em] text-white/48">{band.id}</span>
                <span className="text-[6px] text-white/24">{band.range}</span>
              </div>
              <div aria-hidden="true" className={`mt-1.5 h-[3px] rounded-full bg-gradient-to-r ${band.rail} opacity-75 shadow-[0_0_12px_rgba(125,211,252,0.12)]`} />
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-[1.1fr_1fr_1fr_1.35fr] gap-1.5 font-mono">
          {[
            ["disk rays", `${model.diskRayCount}/4`, "short authority"],
            ["bands", `${model.bandCount}/3`, "fixed response"],
            ["saturation", `${model.saturationCount}/12`, "no adaptive scale"],
            ["profile source", model.tokenSource.toUpperCase(), "manual local-shadow A/B"],
          ].map(([label, value, note]) => (
            <div key={label} className="rounded border border-white/[0.055] bg-white/[0.018] px-2 py-1.5">
              <div className="text-[6px] uppercase tracking-[0.13em] text-white/27">{label}</div>
              <div className="mt-0.5 text-[11px] text-cyan-50/82">{value}</div>
              <div className="mt-0.5 text-[6px] text-white/22">{note}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 grid gap-2 border-t border-white/[0.065] pt-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 font-mono text-[7px]">
            <dt className="text-white/25">band artifact</dt><dd className="truncate text-cyan-100/52">{digest(model.bandArtifactSha256)}</dd>
            <dt className="text-white/25">view digest</dt><dd className="truncate text-cyan-100/52">{digest(model.bandViewDigestSha256)}</dd>
            <dt className="text-white/25">invariants</dt><dd className="text-white/42">payload {model.payloadUnchanged ? "stable" : "pending"} · view {model.bandViewUnchanged ? "stable" : "pending"} · shared {String(model.cinematicBufferShared)}</dd>
            <dt className="text-white/25">dense</dt><dd className="text-amber-100/58">0/49 · incomplete · aggregate unavailable</dd>
          </dl>
          <div className="flex items-center justify-between gap-2 sm:block sm:text-right">
            <div className="font-mono text-[6px] uppercase tracking-[0.12em] text-white/24">sanitized read-only provenance</div>
            <div className="mt-1 flex gap-1 sm:justify-end">
              <button type="button" disabled={!ready} onClick={() => onDownload("json")} className="atlas-accessible-focus rounded border border-cyan-100/15 bg-cyan-100/[0.025] px-2 py-1 font-mono text-[7px] text-cyan-50/68 transition-colors hover:bg-cyan-100/[0.07] disabled:opacity-35">JSON</button>
              <button type="button" disabled={!ready} onClick={() => onDownload("csv")} className="atlas-accessible-focus rounded border border-cyan-100/15 bg-cyan-100/[0.025] px-2 py-1 font-mono text-[7px] text-cyan-50/68 transition-colors hover:bg-cyan-100/[0.07] disabled:opacity-35">CSV</button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded border border-amber-100/10 bg-amber-100/[0.025] px-2 py-1.5" data-kerr-science-profile-ab-card-v324>
          <div className="font-mono text-[7px] text-white/38">
            <span className="uppercase tracking-[0.12em] text-amber-100/48">V5 ↔ V6 Science</span>
            <span className="ml-2">tokens {profileAB.scienceTokenEquivalent ? "equivalent" : "drift"} · digest {profileAB.scienceDigestStable ? "stable" : "pending"} · cinematic copies distinct</span>
          </div>
          <span className={profileAB.status === "qualified-science-equivalent" ? "font-mono text-[7px] text-emerald-100/72" : "font-mono text-[7px] text-amber-100/72"}>{profileAB.status === "qualified-science-equivalent" ? "boundary intact" : "review required"}</span>
        </div>
      </div>
    </header>
  );
}
