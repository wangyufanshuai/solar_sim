"use client";

import { useCallback, useState, useSyncExternalStore, type CSSProperties } from "react";
import {
  getAtlasCalibrationPreflightSnapshotV508,
  getAtlasCalibrationReadinessSnapshotV508,
  subscribeAtlasCalibrationPreflightV508,
  subscribeAtlasCalibrationReadinessV508,
} from "../lib/atlasCalibrationEvidenceClientV508";
import {
  getAtlasCalibrationHudModeSnapshotV506,
  subscribeAtlasCalibrationHudModeV506,
} from "../lib/atlasCalibrationHudModeStoreV506";
import { resolveAtlasCalibrationHudProfileV505 } from "../lib/atlasCalibrationHudProfileV505";
import {
  acquireKerrDetectorProvenanceExportV510,
  createKerrDetectorProvenanceEnvelopeV510,
  type KerrDetectorProvenanceEnvelopeV510,
  type KerrDetectorProvenanceExportFormatV510,
} from "../lib/kerrDetectorProvenanceEnvelopeV510";
import {
  getKerrTopologyDetectorAdmissionSnapshotV501,
  subscribeKerrTopologyDetectorAdmissionV501,
} from "../lib/kerrTopologyDetectorAdmissionClientV501";

export default function KerrDetectorProvenanceEnvelopeV510() {
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
  const [envelope, setEnvelope] = useState<KerrDetectorProvenanceEnvelopeV510 | null>(
    null,
  );
  const [failure, setFailure] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const profile = resolveAtlasCalibrationHudProfileV505(mode.mode);
  const style = {
    "--v510-panel": profile.tokens.panel,
    "--v510-panel-raised": profile.tokens.panelRaised,
    "--v510-ink": profile.tokens.ink,
    "--v510-muted": profile.tokens.mutedInk,
    "--v510-accent": profile.tokens.accent,
    "--v510-wash": profile.tokens.accentWash,
    "--v510-warning": profile.tokens.warning,
    "--v510-blocked": profile.tokens.blocked,
    "--v510-grid": profile.tokens.grid,
  } as CSSProperties;

  const prepare = useCallback(async () => {
    setPreparing(true);
    setFailure(null);
    try {
      setEnvelope(
        await createKerrDetectorProvenanceEnvelopeV510(admission, readiness, preflight),
      );
    } catch {
      setEnvelope(null);
      setFailure("provenance-envelope-failed");
    } finally {
      setPreparing(false);
    }
  }, [admission, readiness, preflight]);

  const download = useCallback(
    (format: KerrDetectorProvenanceExportFormatV510) => {
      if (!envelope) return;
      const acquired = acquireKerrDetectorProvenanceExportV510(envelope, format);
      const anchor = document.createElement("a");
      anchor.href = acquired.objectUrl;
      anchor.download = acquired.filename;
      anchor.click();
      queueMicrotask(acquired.release);
    },
    [envelope],
  );

  return (
    <section
      className="relative mt-7 overflow-hidden rounded-[34px] border border-white/10 bg-[var(--v510-panel)] p-5 text-[var(--v510-ink)] shadow-[0_60px_200px_rgba(0,0,0,.75)] sm:p-8"
      data-atlas-kerr-detector-provenance-envelope-v510
      data-atlas-v510-automatic-request-count="0"
      data-atlas-v510-stage-count="3"
      data-atlas-v510-subscription-count="4"
      data-atlas-v510-export-format-count="2"
      data-atlas-v510-detector-authority="false"
      data-atlas-v510-science-raster="false"
      data-atlas-v510-scientific-field-mutation="false"
      data-atlas-v510-object-url-persistence="0"
      data-atlas-v510-scene-revision-delta="0"
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,var(--v510-wash),transparent_36%),linear-gradient(90deg,var(--v510-grid)_1px,transparent_1px)] bg-[size:auto,64px_64px] opacity-40" />
      <header className="relative border-b border-white/10 pb-6">
        <div className="font-mono text-[9px] uppercase tracking-[.42em] text-[var(--v510-accent)]/65">
          V510 / portable evidence envelope
        </div>
        <h2 className="mt-4 max-w-4xl font-serif text-4xl tracking-[.035em] text-white/90 sm:text-5xl">
          把失败边界也装进可复验的科研档案
        </h2>
        <p className="mt-4 max-w-3xl font-mono text-[10px] leading-6 text-[var(--v510-muted)]">
          Envelope 只读取当前内存中的三阶段净化摘要，不发起请求。它固定记录动态 SHA、请求次数、失败原因与
          authority 边界，并导出可携带 JSON/CSV；导出不会生成 detector response、counts、intensity 或 science raster。
        </p>
      </header>

      <div className="relative mt-6 grid gap-px border border-white/10 bg-white/10 font-mono sm:grid-cols-3">
        <StageState label="admission" sha={admission.summary?.artifactSha256 ?? null} status={admission.status} />
        <StageState label="readiness" sha={readiness.summary?.artifactSha256 ?? null} status={readiness.status} />
        <StageState label="preflight" sha={preflight.summary?.artifactSha256 ?? null} status={preflight.status} />
      </div>

      <div className="relative mt-5 grid gap-4 border border-white/10 bg-[var(--v510-panel-raised)] p-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[.22em] text-white/30">
            Current portable envelope
          </div>
          <div className="mt-3 break-all font-mono text-[9px] leading-5 text-white/60">
            {envelope?.canonicalSha256 ?? failure ?? "not prepared"}
          </div>
          <div className="mt-2 font-mono text-[8px] text-[var(--v510-warning)]/70">
            {envelope?.status ?? "Explicit preparation required · zero automatic network requests"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="atlas-accessible-focus border border-[var(--v510-accent)]/30 bg-[var(--v510-wash)] px-3 py-2 font-mono text-[8px] uppercase tracking-[.15em] text-[var(--v510-accent)]/80"
            disabled={preparing}
            onClick={() => void prepare()}
            type="button"
          >
            {preparing ? "Preparing…" : "Prepare envelope"}
          </button>
          {(["json", "csv"] as const).map((format) => (
            <button
              className="atlas-accessible-focus border border-white/12 bg-black/25 px-3 py-2 font-mono text-[8px] uppercase tracking-[.15em] text-white/55 disabled:cursor-not-allowed disabled:opacity-25"
              disabled={!envelope}
              key={format}
              onClick={() => download(format)}
              type="button"
            >
              Export {format}
            </button>
          ))}
        </div>
      </div>

      <footer className="relative mt-5 grid gap-px border border-white/10 bg-white/10 font-mono sm:grid-cols-4">
        <Boundary label="measured files" value="0 / 6" />
        <Boundary label="dense campaign" value="0 / 49" />
        <Boundary label="detector authority" value="blocked" />
        <Boundary label="formal product" value="v263" />
      </footer>
    </section>
  );
}

function StageState({
  label,
  status,
  sha,
}: Readonly<{
  label: string;
  status: "idle" | "loading" | "ready" | "unavailable";
  sha: string | null;
}>) {
  return (
    <div className="min-w-0 bg-[var(--v510-panel-raised)] p-4">
      <div className="flex items-center justify-between text-[8px] uppercase tracking-[.18em] text-white/30">
        <span>{label}</span>
        <span className={status === "ready" ? "text-[var(--v510-accent)]/75" : "text-[var(--v510-blocked)]/70"}>
          {status}
        </span>
      </div>
      <div className="mt-3 truncate text-[7px] text-white/25">{sha ?? "SHA unavailable"}</div>
    </div>
  );
}

function Boundary({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="bg-[var(--v510-panel-raised)] px-3 py-3 text-center">
      <div className="text-[7px] uppercase tracking-[.15em] text-white/25">{label}</div>
      <div className="mt-1 text-[10px] text-white/65">{value}</div>
    </div>
  );
}
