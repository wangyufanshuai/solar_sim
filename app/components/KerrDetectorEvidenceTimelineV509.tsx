"use client";

import { useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import {
  getKerrTopologyDetectorAdmissionSnapshotV501,
  loadKerrTopologyDetectorAdmissionSummaryV501,
  subscribeKerrTopologyDetectorAdmissionV501,
} from "../lib/kerrTopologyDetectorAdmissionClientV501";
import {
  getAtlasCalibrationPreflightSnapshotV508,
  getAtlasCalibrationReadinessSnapshotV508,
  loadAtlasCalibrationPreflightV508,
  loadAtlasCalibrationReadinessV508,
  subscribeAtlasCalibrationPreflightV508,
  subscribeAtlasCalibrationReadinessV508,
} from "../lib/atlasCalibrationEvidenceClientV508";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  setAtlasCalibrationHudModeV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../lib/atlasCalibrationHudModeStoreV506";
import { resolveAtlasCalibrationHudProfileV505 } from "../lib/atlasCalibrationHudProfileV505";

export default function KerrDetectorEvidenceTimelineV509() {
  const admission = useSyncExternalStore(
    subscribeKerrTopologyDetectorAdmissionV501,
    getKerrTopologyDetectorAdmissionSnapshotV501,
    getKerrTopologyDetectorAdmissionSnapshotV501,
  );
  const readiness = useSyncExternalStore(
    subscribeAtlasCalibrationReadinessV508,
    getAtlasCalibrationReadinessSnapshotV508,
    getAtlasCalibrationReadinessSnapshotV508,
  );
  const preflight = useSyncExternalStore(
    subscribeAtlasCalibrationPreflightV508,
    getAtlasCalibrationPreflightSnapshotV508,
    getAtlasCalibrationPreflightSnapshotV508,
  );
  const mode = useSyncExternalStore(
    subscribeAtlasCalibrationHudModeV506,
    getAtlasCalibrationHudModeSnapshotV506,
    getAtlasCalibrationHudModeSnapshotV506,
  );
  const profile = resolveAtlasCalibrationHudProfileV505(mode.mode);
  const requestCount =
    admission.requestCount + readiness.requestCount + preflight.requestCount;
  const style = {
    "--v509-panel": profile.tokens.panel,
    "--v509-panel-raised": profile.tokens.panelRaised,
    "--v509-ink": profile.tokens.ink,
    "--v509-muted": profile.tokens.mutedInk,
    "--v509-accent": profile.tokens.accent,
    "--v509-wash": profile.tokens.accentWash,
    "--v509-warning": profile.tokens.warning,
    "--v509-blocked": profile.tokens.blocked,
    "--v509-grid": profile.tokens.grid,
    "--v509-grid-opacity": profile.tokens.gridOpacity,
    "--v509-glow": profile.tokens.glowOpacity,
    "--v509-transition": `${profile.tokens.transitionMs}ms`,
  } as CSSProperties;

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[34px] border border-white/10 bg-[var(--v509-panel)] p-5 text-[var(--v509-ink)] shadow-[0_60px_200px_rgba(0,0,0,.75)] transition-colors duration-[var(--v509-transition)] sm:p-8"
      data-atlas-kerr-detector-evidence-timeline-v509
      data-atlas-v509-stage-count="3"
      data-atlas-v509-request-count={requestCount}
      data-atlas-v509-subscription-count="4"
      data-atlas-v509-automatic-request-count="0"
      data-atlas-v509-admitted="false"
      data-atlas-v509-science-raster="false"
      data-atlas-v509-scientific-field-mutation="false"
      data-atlas-v509-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_5%,var(--v509-wash),transparent_35%),linear-gradient(var(--v509-grid)_1px,transparent_1px)] bg-[size:auto,48px_48px] opacity-[calc(var(--v509-grid-opacity)+var(--v509-glow))]" />
      <header className="relative grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.4em] text-[var(--v509-accent)]/60">
            V509 / detector evidence timeline
          </div>
          <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] text-white/90 sm:text-5xl">
            三道门，一条不会跳级的证据链
          </h2>
          <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-[var(--v509-muted)]">
            Admission、readiness 与 explicit preflight 共享模式和缓存，但保留独立 SHA、请求状态与失败原因。
            此时间线只订阅已有 store；除非点击对应按钮，否则不会产生网络请求。
          </p>
        </div>
        <div className="flex border border-white/10 bg-black/30 p-0.5 font-mono">
          {(["science", "cinematic"] as const).map((entry) => (
            <button
              className={
                mode.mode === entry
                  ? "bg-[var(--v509-accent)] px-3 py-2 text-[8px] uppercase text-black"
                  : "px-3 py-2 text-[8px] uppercase text-white/35"
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

      <div className="relative mt-6 grid gap-3 lg:grid-cols-3">
        <Stage
          artifactSha256={admission.summary?.artifactSha256 ?? null}
          boundary="3 pass / 8 blocked · topology cannot bypass calibration"
          index="01"
          onLoad={() =>
            void loadKerrTopologyDetectorAdmissionSummaryV501().catch(() => undefined)
          }
          reason={admission.reason}
          requestCount={admission.requestCount}
          status={admission.status}
          title="Detector admission"
        >
          <span>admitted false</span>
          <span>response unavailable</span>
        </Stage>
        <Stage
          artifactSha256={readiness.summary?.artifactSha256 ?? null}
          boundary="6 exact schemas · provenance and license required"
          index="02"
          onLoad={() => void loadAtlasCalibrationReadinessV508().catch(() => undefined)}
          reason={readiness.reason}
          requestCount={readiness.requestCount}
          status={readiness.status}
          title="Calibration readiness"
        >
          <span>measured files 0 / 6</span>
          <span>authority blocked</span>
        </Stage>
        <Stage
          artifactSha256={preflight.summary?.artifactSha256 ?? null}
          boundary="read-only whitelist · path and size firewall"
          index="03"
          onLoad={() => void loadAtlasCalibrationPreflightV508().catch(() => undefined)}
          reason={preflight.reason}
          requestCount={preflight.requestCount}
          status={preflight.status}
          title="Candidate preflight"
        >
          <span>bytes read {preflight.summary?.observation.bytesRead ?? 0}</span>
          <span>candidate false</span>
        </Stage>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-px border border-white/10 bg-white/10 font-mono sm:grid-cols-5">
        <Metric label="requests" value={String(requestCount)} />
        <Metric label="mode" value={mode.mode} />
        <Metric label="mode revision" value={String(mode.hudRevision)} />
        <Metric label="detector authority" value="false" />
        <Metric label="science pixels" value="0" />
      </div>
      <footer className="relative mt-6 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5 font-mono text-[8px] text-white/30">
        <span>four tracked subscriptions · one explicit detail · zero automatic requests</span>
        <span>response / counts / intensity / science raster unavailable</span>
      </footer>
    </section>
  );
}

function Stage({
  index,
  title,
  status,
  reason,
  requestCount,
  artifactSha256,
  boundary,
  onLoad,
  children,
}: Readonly<{
  index: string;
  title: string;
  status: "idle" | "loading" | "ready" | "unavailable";
  reason: string | null;
  requestCount: 0 | 1;
  artifactSha256: string | null;
  boundary: string;
  onLoad: () => void;
  children: ReactNode;
}>) {
  return (
    <article className="border border-white/10 bg-[var(--v509-panel-raised)] p-4">
      <div className="flex items-center justify-between font-mono text-[8px] uppercase tracking-[.18em] text-white/30">
        <span>{index}</span>
        <span
          className={
            status === "ready"
              ? "text-[var(--v509-accent)]/75"
              : status === "unavailable"
                ? "text-[var(--v509-blocked)]/75"
                : "text-[var(--v509-warning)]/70"
          }
        >
          {status}
        </span>
      </div>
      <h3 className="mt-4 font-serif text-2xl text-white/82">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2 font-mono text-[8px] text-white/38">
        {children}
      </div>
      <p className="mt-4 min-h-8 font-mono text-[8px] leading-4 text-white/28">{boundary}</p>
      <div className="mt-3 truncate font-mono text-[7px] text-white/22">
        {artifactSha256 ?? `SHA unavailable${reason ? ` · ${reason}` : ""}`}
      </div>
      <button
        className="atlas-accessible-focus mt-4 border border-[var(--v509-accent)]/25 bg-[var(--v509-wash)] px-3 py-2 font-mono text-[8px] uppercase tracking-[.14em] text-[var(--v509-accent)]/75"
        onClick={onLoad}
        type="button"
      >
        {requestCount === 0 ? "Load stage evidence" : "Use cached evidence"}
      </button>
    </article>
  );
}

function Metric({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="min-w-0 bg-[var(--v509-panel-raised)] px-3 py-3 text-center">
      <div className="truncate text-[7px] uppercase tracking-[.15em] text-white/25">{label}</div>
      <div className="mt-1 truncate text-[11px] text-white/70">{value}</div>
    </div>
  );
}
