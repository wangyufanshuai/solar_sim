"use client";

import { useEffect, useMemo, useState } from "react";
import { parseRelativityEvidenceResponseV342, type RelativityEvidenceResponseV342 } from "../lib/relativityWorkbenchEvidenceV342";

const BAND_LABELS = Object.freeze({ visible: "VIS", euv: "EUV", "soft-x-ray": "SXR" });
function scientific(value: number): string { return Number.isFinite(value) ? value.toExponential(2) : "—"; }
function short(value: string | null): string { return value == null ? "unavailable" : `${value.slice(0, 8)}…${value.slice(-6)}`; }

export default function RelativityEvidenceSurfaceV342() {
  const [response, setResponse] = useState<RelativityEvidenceResponseV342>({ version: "v342-relativity-evidence-response", available: false, reason: "evidence-unavailable", snapshot: null });
  const [band, setBand] = useState("visible");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/atlas/relativity-evidence/v342", { cache: "no-store", signal: controller.signal })
      .then(async (value) => parseRelativityEvidenceResponseV342(await value.json()))
      .then(setResponse)
      .catch(() => { if (!controller.signal.aborted) setResponse({ version: "v342-relativity-evidence-response", available: false, reason: "evidence-corrupt", snapshot: null }); });
    return () => controller.abort();
  }, []);
  const raster = response.snapshot?.current.v342;
  const cells = useMemo(() => raster?.cells.filter((cell) => cell.bandId === band) ?? [], [raster, band]);
  const ready = response.available && raster != null;
  return (
    <section className="relative mt-2 overflow-hidden rounded-[10px] border border-sky-100/15 bg-[linear-gradient(150deg,rgba(4,14,26,0.96),rgba(5,8,18,0.98)_68%,rgba(8,16,29,0.96))] p-3 font-mono text-[8px] text-white/52" data-atlas-relativity-evidence-v342 data-atlas-relativity-evidence-v342-status={ready ? "ready" : response.reason}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_0%,rgba(106,185,255,0.1),transparent_31%),linear-gradient(90deg,transparent_49.8%,rgba(148,220,255,0.025)_50%,transparent_50.2%)]" />
      <div className="relative flex flex-wrap items-end justify-between gap-2"><div><div className="text-[7px] uppercase tracking-[0.2em] text-sky-100/40">Sparse image plane v342</div><div className="mt-0.5 text-[13px] tracking-[0.045em] text-sky-50/90">Measurement grid / error envelope</div></div><div className="text-right text-[7px] text-amber-100/62">{raster?.denseStatus ?? "dense unavailable"}<br /><span className="text-white/28">fixed linear reference · browser not run</span></div></div>
      <div className="relative mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Observation band selector">
        {["visible", "euv", "soft-x-ray"].map((item) => <button key={item} type="button" role="tab" aria-selected={band === item} onClick={() => setBand(item)} className={band === item ? "atlas-accessible-focus rounded border border-sky-200/35 bg-sky-100/[0.1] px-2 py-1 text-[7px] text-sky-50/88" : "atlas-accessible-focus rounded border border-white/[0.09] bg-white/[0.02] px-2 py-1 text-[7px] text-white/40 hover:text-white/70"}>{BAND_LABELS[item as keyof typeof BAND_LABELS]}</button>)}
      </div>
      <div className="relative mt-2 grid gap-1.5 sm:grid-cols-4" aria-live="polite">
        {cells.map((cell) => <article key={`${cell.rayIndex}:${cell.bandId}`} className="relative overflow-hidden rounded border border-white/[0.08] bg-black/20 px-2 py-2" data-atlas-raster-cell={cell.rayIndex}>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,rgba(73,184,226,0.35),rgba(255,199,117,0.65))]" style={{ opacity: 0.3 + cell.scienceLinearDisplay01 * 0.7 }} />
          <div className="flex items-center justify-between text-[7px] text-white/34"><span>ray {String(cell.rayIndex).padStart(2, "0")}</span><span>a {cell.spinA.toFixed(3)}</span></div>
          <div className="mt-1 text-[12px] text-sky-50/84">{scientific(cell.observedEnergyRadianceWM2Sr)}</div>
          <div className="mt-0.5 text-[7px] text-white/36">± {scientific(cell.conservativeLinearRelativeEnvelope)} · g {cell.redshiftFactor.toFixed(5)}</div>
          <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 border-t border-white/[0.07] pt-1 text-[7px]"><span className="text-white/27">EVPA</span><span className="text-right text-sky-100/66">{cell.walkerPenroseEvpaDeg.toFixed(3)}°</span><span className="text-white/27">ΔEVPA</span><span className="text-right text-emerald-100/66">{scientific(cell.evpaDifferenceDeg)}°</span><span className="text-white/27">order</span><span className="text-right text-white/55">{cell.imageOrder}</span></div>
          <div className="mt-1 text-[6px] uppercase tracking-[0.12em] text-white/22">science raw / error bounded</div>
        </article>)}
        {!ready ? <div className="col-span-full rounded border border-amber-100/10 bg-amber-100/[0.025] px-2 py-3 text-amber-100/64">{response.reason === "lite-boundary" ? "Lite excludes the sparse observation raster." : response.reason === "evidence-corrupt" ? "Observation evidence failed closed; no raster is shown." : "Loading bounded observation cells…"}</div> : null}
      </div>
      <div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2 text-[7px] text-white/32"><span>Science digest {short(raster?.scienceDigest ?? null)} · {raster?.cellCount ?? 0}/12 cells · V5/V6/V7 invariant</span><span>{raster?.cinematicCopiesDisjoint ? "Cinematic copy disjoint" : "Cinematic pending"}</span></div>
    </section>
  );
}
