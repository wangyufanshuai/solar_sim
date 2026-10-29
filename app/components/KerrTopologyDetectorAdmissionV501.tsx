"use client";

import Image from "next/image";
import { useSyncExternalStore, type CSSProperties } from "react";
import {
  getKerrTopologyDetectorAdmissionSnapshotV501,
  loadKerrTopologyDetectorAdmissionSummaryV501,
  subscribeKerrTopologyDetectorAdmissionV501,
} from "../lib/kerrTopologyDetectorAdmissionClientV501";
import {
  bindAtlasCalibrationHudV505,
} from "../lib/atlasCalibrationHudProfileV505";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  setAtlasCalibrationHudModeV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../lib/atlasCalibrationHudModeStoreV506";

export default function KerrTopologyDetectorAdmissionV501() {
  const state = useSyncExternalStore(
    subscribeKerrTopologyDetectorAdmissionV501,
    getKerrTopologyDetectorAdmissionSnapshotV501,
    getKerrTopologyDetectorAdmissionSnapshotV501,
  );
  const modeSnapshot = useSyncExternalStore(
    subscribeAtlasCalibrationHudModeV506,
    getAtlasCalibrationHudModeSnapshotV506,
    getAtlasCalibrationHudModeSnapshotV506,
  );
  const binding = bindAtlasCalibrationHudV505(modeSnapshot.mode, state.summary);
  const summary = binding.sciencePayload;
  const profile = binding.profile;
  const style = {
    "--v501-panel": profile.tokens.panel,
    "--v501-panel-raised": profile.tokens.panelRaised,
    "--v501-ink": profile.tokens.ink,
    "--v501-muted": profile.tokens.mutedInk,
    "--v501-accent": profile.tokens.accent,
    "--v501-wash": profile.tokens.accentWash,
    "--v501-warning": profile.tokens.warning,
    "--v501-blocked": profile.tokens.blocked,
    "--v501-grid": profile.tokens.grid,
    "--v501-grid-opacity": profile.tokens.gridOpacity,
    "--v501-glow": profile.tokens.glowOpacity,
    "--v501-transition": `${profile.tokens.transitionMs}ms`,
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[34px] border border-white/10 bg-[var(--v501-panel)] p-5 text-[var(--v501-ink)] shadow-[0_70px_220px_rgba(0,0,0,.8)] transition-colors duration-[var(--v501-transition)] sm:p-8"
      data-atlas-kerr-topology-detector-admission-v501
      data-atlas-v501-mode={modeSnapshot.mode}
      data-atlas-v501-request-count={state.requestCount}
      data-atlas-v501-admitted="false"
      data-atlas-v501-topology-bypass="false"
      data-atlas-v501-science-writeback="false"
      data-atlas-v501-science-raster="false"
      data-atlas-v501-scene-revision-delta="0"
      data-atlas-v507-hud-mode-store="external"
      data-atlas-v507-hud-revision={modeSnapshot.hudRevision}
      data-atlas-v507-science-payload-reference-preserved="true"
      data-atlas-v507-scientific-field-mutation="false"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_8%,var(--v501-wash),transparent_43%),linear-gradient(var(--v501-grid)_1px,transparent_1px)] bg-[size:auto,46px_46px] opacity-[calc(var(--v501-grid-opacity)+var(--v501-glow))]" />
      <header className="relative flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-6">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.42em] text-[var(--v501-accent)]/65">
            V501 / detector admission bridge
          </div>
          <h1 className="mt-4 font-serif text-4xl tracking-[.035em] text-white/90 sm:text-6xl">
            Topology is authority, not a calibration
          </h1>
          <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-[var(--v501-muted)]">
            The v500 topology chain reaches a measured detector airlock. Schema and the
            synthetic-production firewall pass; six measured files, provenance, license,
            blind validation and production response remain missing.
          </p>
        </div>
        <div className="flex border border-white/12 bg-black/55 p-1 font-mono text-[8px] uppercase tracking-[.2em]">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={
                modeSnapshot.mode === entry
                  ? "bg-[var(--v501-accent)] px-4 py-2.5 text-black"
                  : "px-4 py-2.5 text-white/30"
              }
              key={entry}
              onClick={() => setAtlasCalibrationHudModeV506(entry)}
              type="button"
            >
              {entry}
            </button>
          ))}
        </div>
      </header>

      {state.status === "idle" ? (
        <div className="relative mt-6 border border-dashed border-[var(--v501-accent)]/20 bg-white/[.02] p-5">
          <div className="font-mono text-[10px] text-white/45">
            Load the bounded admission decision explicitly. This does not inspect, fetch or
            stage detector files.
          </div>
          <button
            className="atlas-accessible-focus mt-4 border border-[var(--v501-accent)]/35 bg-[var(--v501-wash)] px-4 py-2 font-mono text-[9px] uppercase tracking-[.16em] text-[var(--v501-accent)]"
            onClick={() =>
              void loadKerrTopologyDetectorAdmissionSummaryV501().catch(() => undefined)
            }
            type="button"
          >
            Load admission bridge
          </button>
        </div>
      ) : null}
      {state.status === "loading" ? (
        <div className="relative mt-6 font-mono text-[10px] text-white/50">
          Verifying v500, v458–v465, admission gates and SVG SHA…
        </div>
      ) : null}
      {state.status === "unavailable" ? (
        <div className="relative mt-6 font-mono text-[10px] text-[var(--v501-warning)]/70">
          Admission bridge unavailable / {state.reason ?? "request-failed"}
        </div>
      ) : null}

      {summary ? (
        <>
          <div className="relative mt-6 grid grid-cols-2 gap-px border border-white/10 bg-white/10 font-mono sm:grid-cols-5">
            <Stat label="gates" value="11" />
            <Stat label="passed" value="3" />
            <Stat label="blocked" value="8" />
            <Stat label="measured files" value="0 / 6" />
            <Stat label="admitted" value="false" />
          </div>
          <figure className="relative mt-5 overflow-hidden border border-white/10 bg-black/35 p-2 sm:p-4">
            <Image
              alt="Topology authority chain entering a fail-closed measured detector admission airlock"
              className="block h-auto w-full"
              height={980}
              src={summary.svgHref}
              unoptimized
              width={1440}
            />
            <figcaption className="border-t border-white/8 px-2 pt-3 font-mono text-[8px] leading-4 text-white/32">
              Both modes share the identical blocked decision. Cinematic presentation cannot
              manufacture measured files, detector response, counts or intensity.
            </figcaption>
          </figure>
          <div className="relative mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summary.gates.map((gate) => (
              <article
                className={
                  gate.passed
                    ? "border border-[var(--v501-accent)]/15 bg-[var(--v501-wash)] p-4"
                    : "border border-[var(--v501-blocked)]/20 bg-[var(--v501-blocked)]/[.035] p-4"
                }
                key={gate.id}
              >
                <div className="font-mono text-[9px] text-white/70">{gate.id}</div>
                <div className="mt-2 font-mono text-[8px] text-white/30">{gate.evidence}</div>
                <div
                  className={
                    gate.passed
                      ? "mt-3 font-mono text-[8px] text-[var(--v501-accent)]/70"
                      : "mt-3 font-mono text-[8px] text-[var(--v501-blocked)]/70"
                  }
                >
                  {gate.passed ? "PASS" : "BLOCK"}
                </div>
              </article>
            ))}
          </div>
          <footer className="relative mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] text-white/30">
            <span>reason {summary.decision.reason} / detector response unavailable</span>
            <span className="flex gap-2">
              <a className="border border-white/12 px-3 py-1.5" href={`${summary.svgHref}&download=svg`}>
                export SVG
              </a>
              <a
                className="border border-white/12 px-3 py-1.5"
                href="/api/atlas/relativity-evidence/v501/topology-detector-admission?download=audit"
              >
                export provenance
              </a>
            </span>
          </footer>
        </>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-[var(--v501-panel-raised)] px-4 py-3 text-center">
      <div className="text-[7px] uppercase tracking-[.18em] text-white/25">{label}</div>
      <div className="mt-1 font-serif text-xl text-white/75">{value}</div>
    </div>
  );
}
