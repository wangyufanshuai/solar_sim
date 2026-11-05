"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import { resolveAtlasScienceCinematicV7V457 } from "../lib/atlasScienceCinematicV7V457";
import {
  getKerrMeasuredDetectorIntakeSnapshotV458,
  loadKerrMeasuredDetectorIntakeSummaryV458,
  subscribeKerrMeasuredDetectorIntakeV458,
} from "../lib/kerrMeasuredDetectorIntakeClientV458";

export default function KerrMeasuredDetectorDataAirlockV458() {
  const state = useSyncExternalStore(
    subscribeKerrMeasuredDetectorIntakeV458,
    getKerrMeasuredDetectorIntakeSnapshotV458,
    getKerrMeasuredDetectorIntakeSnapshotV458,
  );
  const tokens = resolveAtlasScienceCinematicV7V457("science");
  useEffect(() => {
    void loadKerrMeasuredDetectorIntakeSummaryV458().catch(() => undefined);
  }, []);
  const style = {
    "--v458-ink": tokens.productGate.ink,
    "--v458-panel": tokens.productGate.panel,
    "--v458-grid": tokens.productGate.grid,
    "--v458-ready": tokens.productGate.qualified,
    "--v458-blocked": tokens.productGate.blocked,
  } as CSSProperties;
  return (
    <section
      style={style}
      className="relative mt-6 overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(ellipse_at_95%_5%,rgba(251,191,36,.1),transparent_32%),linear-gradient(142deg,var(--v458-panel),#020609_58%,#0a0703)] p-5 font-mono text-[var(--v458-ink)] shadow-[0_34px_120px_rgba(0,0,0,.56)] sm:p-7"
      data-atlas-kerr-measured-detector-airlock-v458
      data-atlas-v458-ready-files="0"
      data-atlas-v458-measured-authority="false"
      data-atlas-v458-runtime-projection="false"
      data-atlas-v458-science-raster="false"
      data-atlas-v458-fits-write="false"
      data-atlas-v458-png-write="false"
    >
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(var(--v458-grid)_1px,transparent_1px),linear-gradient(90deg,var(--v458-grid)_1px,transparent_1px)] [background-size:42px_42px]" />
      <header className="relative grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="text-[9px] uppercase tracking-[.34em] opacity-45">
            V458 / measured detector data airlock
          </div>
          <h2 className="mt-3 max-w-4xl font-serif text-3xl tracking-[.08em] sm:text-4xl">
            六把钥匙，一把都不能由模板冒充
          </h2>
          <p className="mt-3 max-w-3xl text-[11px] leading-6 opacity-55">
            Schema、单位、跨文件身份、许可和 SHA 链已经可以机器验证；真实 staging
            仍为空。合成 control 只能证明验证器工作，不能成为探测器数据。
          </p>
        </div>
        <div className="border border-[var(--v458-blocked)]/30 bg-[var(--v458-blocked)]/[.04] px-4 py-3 text-right">
          <div className="text-[8px] uppercase tracking-[.2em] opacity-45">production intake</div>
          <div className="mt-1 text-2xl font-light text-[var(--v458-blocked)]">0 / 6</div>
        </div>
      </header>
      {!state.summary ? (
        <div className="relative mt-5 border-l-2 border-white/20 bg-white/[.025] px-4 py-3 text-[10px] opacity-60">
          {state.status === "idle" || state.status === "loading"
            ? "正在读取 detector intake 证据…"
            : `Intake 证据不可用 / ${state.reason ?? "request-failed"}`}
        </div>
      ) : (
        <>
          <div className="relative mt-6 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {state.summary.inspect.files.map((file, index) => {
              const schema = state.summary?.schemaPack.schemas.find(
                (entry) => entry.id === file.id,
              );
              return (
                <article
                  key={file.id}
                  className="group relative overflow-hidden border border-white/10 bg-black/25 p-4"
                  data-atlas-v458-file={file.id}
                  data-atlas-v458-file-status={file.status}
                >
                  <div className="absolute inset-y-0 left-0 w-px bg-[var(--v458-blocked)] opacity-65" />
                  <div className="flex items-center justify-between gap-3 text-[8px] uppercase tracking-[.18em] opacity-45">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-[var(--v458-blocked)]">{file.status}</span>
                  </div>
                  <h3 className="mt-4 text-[11px] tracking-[.08em]">{file.id}</h3>
                  <div className="mt-2 text-[9px] opacity-40">
                    {file.fileName} · {schema?.schemaVersion}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {schema?.unitContract.map((unit) => (
                      <span
                        key={unit}
                        className="border border-white/8 px-2 py-1 text-[7px] opacity-35"
                      >
                        {unit}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="relative mt-4 grid gap-4 border border-white/10 bg-black/25 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="text-[9px] uppercase tracking-[.22em] opacity-45">
                Synthetic / production firewall
              </div>
              <p className="mt-2 max-w-3xl text-[10px] leading-5 opacity-45">
                1 个 synthetic control 已通过，11 个对抗 fixture 已拒绝；control authority
                始终为 false。真实文件还必须完成独立验证和显式 authority grant。
              </p>
            </div>
            <div className="grid grid-cols-3 gap-px bg-white/10 text-center text-[8px]">
              <Metric value="1" label="control" />
              <Metric value="11" label="rejected" />
              <Metric value="0" label="authority" />
            </div>
          </div>
          <footer className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-[8px] uppercase tracking-[.14em] opacity-45">
            <span>no network · no runtime packaging · no FITS/PNG · dense 0/49</span>
            <nav className="flex gap-2">
              {(["inspect", "contract", "schema"] as const).map((id) => (
                <a
                  key={id}
                  className="border border-white/10 px-2 py-1 hover:border-white/30 hover:opacity-90"
                  href={`/api/atlas/relativity-evidence/v458/measured-detector-intake?download=${id}`}
                >
                  {id}
                </a>
              ))}
            </nav>
          </footer>
        </>
      )}
    </section>
  );
}

function Metric({ value, label }: Readonly<{ value: string; label: string }>) {
  return (
    <div className="min-w-20 bg-black/45 px-3 py-2">
      <div className="text-sm text-[var(--v458-blocked)]">{value}</div>
      <div className="mt-1 opacity-35">{label}</div>
    </div>
  );
}
