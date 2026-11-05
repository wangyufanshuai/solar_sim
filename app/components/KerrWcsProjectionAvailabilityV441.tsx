"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrWcsProjectionSnapshotV441,
  loadKerrWcsProjectionSummaryV441,
  subscribeKerrWcsProjectionV441,
} from "../lib/kerrWcsProjectionAvailabilityClientV441";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V405,
  resolveAtlasVisualProfileV299,
} from "../lib/atlasVisualProfileV299";
import {
  createAtlasVisualTokenSignatureV300,
  useAtlasVisualRuntimeConsumerV300,
} from "../lib/atlasVisualRuntimeConsumptionV300";

export default function KerrWcsProjectionAvailabilityV441() {
  const state = useSyncExternalStore(
    subscribeKerrWcsProjectionV441,
    getKerrWcsProjectionSnapshotV441,
    getKerrWcsProjectionSnapshotV441,
  );

  useEffect(() => {
    void loadKerrWcsProjectionSummaryV441().catch(() => undefined);
  }, []);

  const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V405);
  const tokens = profile.runtimeTokens.hud.evidenceObservatoryV13;
  const summary = state.summary;

  if (!tokens) throw new Error("v441-wcs-token-boundary");

  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrWcsProjectionAvailabilityV441",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });

  const style = {
    "--v441-panel": tokens.panelOpacity,
    "--v441-grain": tokens.evidenceGrainOpacity,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="relative mt-3 overflow-hidden rounded-[18px] border border-sky-100/12 bg-[radial-gradient(circle_at_88%_12%,rgba(56,189,248,.075),transparent_30%),linear-gradient(142deg,rgba(2,8,13,var(--v441-panel)),rgba(3,8,10,var(--v441-panel))_62%,rgba(11,8,2,var(--v441-panel)))] p-3 font-mono text-white/55"
      data-atlas-kerr-wcs-projection-v441
      data-atlas-v441-summary-only-in-react-state="true"
      data-atlas-v441-wcs-authority="true"
      data-atlas-v441-detector-projection="blocked"
      data-atlas-v441-psf-authority="false"
      data-atlas-v441-canvas-created="false"
      data-atlas-v441-profile={profile.id}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[var(--v441-grain)] [background-image:repeating-linear-gradient(116deg,transparent_0_9px,rgba(125,211,252,.055)_10px,transparent_11px_21px)]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3 border-b border-white/7 pb-3">
        <div>
          <div className="text-[6px] uppercase tracking-[.32em] text-sky-100/48">
            V441 / WCS projection authority
          </div>
          <h4 className="mt-1 text-[21px] font-light uppercase tracking-[.15em] text-sky-50/90">
            WCS qualified · detector projection blocked
          </h4>
          <p className="mt-1 max-w-[100ch] text-[6px] leading-relaxed text-white/35">
            The linear observer WCS agrees with the independent Astropy oracle. Measured detector
            geometry, distortion, PSF and pixel response remain unavailable.
          </p>
        </div>
        <div
          className="border border-sky-100/14 bg-sky-100/[.025] px-2.5 py-1.5 text-[6px] uppercase tracking-[.12em] text-sky-100/62"
          data-atlas-v441-status={state.status}
        >
          {state.status}
        </div>
      </header>

      {!summary ? (
        <div className="relative mt-3 border-l-2 border-sky-100/25 bg-sky-100/[.025] px-3 py-2 text-[7px] text-sky-50/48">
          {state.status === "loading" || state.status === "idle"
            ? "Reading WCS projection audit..."
            : `WCS projection audit unavailable / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-3 grid gap-px bg-white/6 sm:grid-cols-4">
            <Metric label="WCS sources" value="4" tone="sky" />
            <Metric label="coordinate joins" value="24" tone="cyan" />
            <Metric label="detector geometry" value="0" tone="amber" />
            <Metric label="PSF models" value="0" tone="amber" />
          </div>
          <div className="relative mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_300px]">
            <div className="relative overflow-hidden border border-sky-100/10 bg-black/28 p-3">
              <div className="flex items-center justify-between text-[5px] uppercase tracking-[.15em] text-sky-100/42">
                <span>{summary.wcs.name}</span>
                <span>
                  {summary.wcs.width} × {summary.wcs.height} · linear
                </span>
              </div>
              <div className="relative mt-4 h-28 overflow-hidden border border-white/7 bg-[linear-gradient(90deg,transparent_49.7%,rgba(125,211,252,.14)_50%,transparent_50.3%),linear-gradient(0deg,transparent_49.7%,rgba(125,211,252,.11)_50%,transparent_50.3%)]">
                {summary.rows.map((row) => (
                  <span
                    key={row.rayId}
                    className="absolute h-2 w-2 rounded-full border border-sky-50/40 bg-sky-200/75 shadow-[0_0_14px_rgba(125,211,252,.72)]"
                    style={{
                      left: `${(row.continuousPixelX / summary.wcs.width) * 100}%`,
                      top: `${100 - (row.continuousPixelY / summary.wcs.height) * 100}%`,
                    }}
                    data-atlas-v441-wcs-source={row.rayId}
                  />
                ))}
              </div>
              <div className="mt-2 grid gap-px bg-white/6 sm:grid-cols-3">
                <Metric label="Astropy Δpx" value="0" tone="lime" />
                <Metric
                  label="roundtrip"
                  value={summary.maxima.worldRoundtripResidualM.toExponential(2)}
                  tone="lime"
                />
                <Metric
                  label="join Δpx"
                  value={summary.maxima.sourceCoordinateJoinResidualPixel.toExponential(2)}
                  tone="lime"
                />
              </div>
              <div className="mt-3 border-l-2 border-amber-100/24 bg-amber-100/[.025] px-2 py-1.5 text-[6px] leading-relaxed text-amber-50/48">
                WCS coordinate authority does not imply detector geometry, PSF, distortion
                calibration, pixel response or image authority.
              </div>
            </div>
            <aside className="grid gap-px bg-white/6">
              <Metric label="WCS transform" value="QUALIFIED" tone="lime" />
              <Metric label="distortion calibration" value="UNAVAILABLE" tone="amber" />
              <Metric label="pixel response" value="UNAVAILABLE" tone="amber" />
              <Metric label="raster" value="BLOCKED" tone="amber" />
            </aside>
          </div>
          <footer className="relative mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/7 pt-2 text-[5px] uppercase tracking-[.08em] text-white/28">
            <span>WCS grid allowed · no PSF synthesis · no detector image claim</span>
            <span className="text-amber-100/45">measured projection pending</span>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: string; tone: "sky" | "cyan" | "lime" | "amber" }>) {
  const color =
    tone === "sky"
      ? "text-sky-100/60"
      : tone === "cyan"
        ? "text-cyan-100/60"
        : tone === "lime"
          ? "text-lime-100/60"
          : "text-amber-100/58";

  return (
    <div className="bg-black/35 px-2.5 py-2">
      <div className="text-[5px] uppercase tracking-[.1em] text-white/23">{label}</div>
      <div className={`mt-0.5 text-[7px] ${color}`}>{value}</div>
    </div>
  );
}
