"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";

import {
  getKerrDetectorInputAdmissionSnapshotV451,
  loadKerrDetectorInputAdmissionSummaryV451,
  subscribeKerrDetectorInputAdmissionV451,
} from "../lib/kerrDetectorInputAdmissionClientV451";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V405,
  resolveAtlasVisualProfileV299,
} from "../lib/atlasVisualProfileV299";
import {
  createAtlasVisualTokenSignatureV300,
  useAtlasVisualRuntimeConsumerV300,
} from "../lib/atlasVisualRuntimeConsumptionV300";

export default function KerrDetectorInputAdmissionV451() {
  const state = useSyncExternalStore(
    subscribeKerrDetectorInputAdmissionV451,
    getKerrDetectorInputAdmissionSnapshotV451,
    getKerrDetectorInputAdmissionSnapshotV451,
  );
  useEffect(() => {
    void loadKerrDetectorInputAdmissionSummaryV451().catch(() => undefined);
  }, []);
  const profile = resolveAtlasVisualProfileV299(
    ATLAS_VISUAL_PROFILE_CANDIDATE_V405,
  );
  const tokens = profile.runtimeTokens.hud.evidenceObservatoryV13;
  if (!tokens) throw new Error("v451-admission-token-boundary");
  useAtlasVisualRuntimeConsumerV300({
    profile: profile.id,
    group: "hud",
    consumer: "KerrDetectorInputAdmissionV451",
    tokenSignature: createAtlasVisualTokenSignatureV300(profile.runtimeTokens.hud),
  });

  return (
    <section
      className="relative mt-5 overflow-hidden rounded-[26px] border border-amber-100/15 bg-[radial-gradient(circle_at_84%_0%,rgba(251,191,36,.08),transparent_29%),linear-gradient(140deg,#0e0c07,#07090b_62%,#0b0704)] p-4 font-mono text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,.38)] sm:p-6"
      style={{ "--v451-panel": tokens.panelOpacity } as CSSProperties}
      data-atlas-kerr-detector-admission-v451
      data-atlas-v451-measured-authority="false"
      data-atlas-v451-runtime-projection="false"
      data-atlas-v451-science-raster="false"
      data-atlas-v451-profile={profile.id}
    >
      <header className="relative flex flex-wrap items-end justify-between gap-4 border-b border-amber-50/10 pb-5">
        <div>
          <div className="text-[9px] uppercase tracking-[.3em] text-amber-100/50">
            V451 / detector input admission
          </div>
          <h2 className="mt-3 font-serif text-2xl tracking-[.06em] text-amber-50/90 sm:text-3xl">
            六项仪器输入 · 实测准入闸门
          </h2>
          <p className="mt-3 max-w-3xl text-[11px] leading-6 text-slate-300/55">
            只有六项带 provenance 的仪器输入、SHA 链接和 v372–v374 独立验证都存在，才能允许 detector projection。
            当前摘要只读，不会请求网络，也不会把 fixture 电子数升级为实测值。
          </p>
        </div>
        <div
          className="border border-amber-100/20 bg-amber-100/[.04] px-3 py-2 text-[9px] uppercase tracking-[.14em] text-amber-100/70"
          data-atlas-v451-status={state.status}
        >
          {state.status}
        </div>
      </header>
      {!state.summary ? (
        <div className="relative mt-5 border-l-2 border-amber-100/30 bg-amber-100/[.025] px-4 py-3 text-[10px] text-amber-50/55">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取输入准入摘要…"
            : `准入摘要不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-5 grid gap-px bg-white/7 sm:grid-cols-2 xl:grid-cols-3">
            {state.summary.detector.files.map((file) => (
              <article key={file.id} className="bg-[#090b0d] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] uppercase tracking-[.16em] text-amber-50/70">
                    {file.id}
                  </span>
                  <span
                    className={
                      file.status === "ready"
                        ? "text-cyan-100/75"
                        : "text-amber-100/70"
                    }
                    data-atlas-v451-file-status={file.status}
                  >
                    {file.status}
                  </span>
                </div>
                <div className="mt-3 text-[9px] leading-5 text-slate-400/50">
                  {file.fileName} · {file.format} · {file.bytes} B
                </div>
                <div className="mt-2 text-[8px] leading-4 text-slate-400/35">
                  {file.reasons.join(" · ") || "structural checks ready"}
                </div>
              </article>
            ))}
          </div>
          <div className="relative mt-4 grid gap-3 border border-white/8 bg-black/20 p-4 text-[10px] sm:grid-cols-2">
            <Gate label="六项输入" value={`${state.summary.detector.readyFileCount}/6 ready`} />
            <Gate
              label="provenance SHA linkage"
              value={state.summary.qualification.provenanceShaLinkageQualified ? "qualified" : "blocked"}
            />
            <Gate label="独立 v372–v374" value="required / not run" />
            <Gate label="measured authority" value="not granted" />
            <Gate label="runtime projection" value="blocked" />
            <Gate label="science raster" value="blocked" />
          </div>
          <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-amber-50/10 pt-4 text-[8px] uppercase tracking-[.12em] text-slate-400/45">
            <span>fixture join allowed · measured image unavailable · dense 0/49</span>
            <a
              className="border border-amber-100/15 px-2 py-1 text-amber-100/60 hover:border-amber-100/30 hover:text-amber-50/85"
              href="/api/atlas/relativity-evidence/v451/detector-admission?download=qualification"
            >
              qualification JSON
            </a>
          </footer>
        </>
      )}
    </section>
  );
}

function Gate({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/6 py-1.5">
      <span className="text-slate-400/45">{label}</span>
      <span className="text-amber-100/65">{value}</span>
    </div>
  );
}
