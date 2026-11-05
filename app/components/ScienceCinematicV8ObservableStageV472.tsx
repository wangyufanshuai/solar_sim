"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";

import {
  auditAtlasScienceCinematicV8V472,
  resolveAtlasScienceCinematicV8V472,
  type AtlasScienceCinematicV8ModeV472,
} from "../lib/atlasScienceCinematicV8V472";
import {
  getKerrObservableProvenanceSnapshotV471,
  loadKerrObservableProvenanceSummaryV471,
  subscribeKerrObservableProvenanceV471,
} from "../lib/kerrObservableProvenanceClientV471";

const STATUS_COLOR_KEYS = {
  "available-short-authority": "shortAuthority",
  "available-coordinate-authority": "coordinateAuthority",
  "available-analytic-fixture": "analyticFixture",
  "unavailable-production-authority": "unavailable",
} as const;

export default function ScienceCinematicV8ObservableStageV472() {
  const state = useSyncExternalStore(
    subscribeKerrObservableProvenanceV471,
    getKerrObservableProvenanceSnapshotV471,
    getKerrObservableProvenanceSnapshotV471,
  );
  const [mode, setMode] = useState<AtlasScienceCinematicV8ModeV472>("science");
  const [selectedId, setSelectedId] = useState("geometry-classification");
  const tokens = resolveAtlasScienceCinematicV8V472(mode);
  const audit = auditAtlasScienceCinematicV8V472();

  useEffect(() => {
    void loadKerrObservableProvenanceSummaryV471().catch(() => undefined);
  }, []);

  const selected =
    state.summary?.rows.find((row) => row.id === selectedId) ?? state.summary?.rows[0] ?? null;
  const style = {
    "--v472-sky-zenith": tokens.sky.zenith,
    "--v472-sky-horizon": tokens.sky.horizon,
    "--v472-star-opacity": tokens.sky.starOpacity,
    "--v472-milky-opacity": tokens.sky.milkyWayOpacity,
    "--v472-sun-core": tokens.solar.sunCore,
    "--v472-planet-rim": tokens.solar.planetRim,
    "--v472-ring-opacity": tokens.solar.ringOpacity,
    "--v472-catalog-point": tokens.catalog.pointColor,
    "--v472-catalog-density": tokens.catalog.densityOpacity,
    "--v472-selection-halo": tokens.catalog.selectionHalo,
    "--v472-disk-hot": tokens.strongGravity.diskHot,
    "--v472-disk-cool": tokens.strongGravity.diskCool,
    "--v472-launch-plume": tokens.launch.plume,
    "--v472-launch-telemetry": tokens.launch.telemetry,
    "--v472-exoplanet-limb": tokens.exoplanet.limb,
    "--v472-exoplanet-atmosphere": tokens.exoplanet.atmosphere,
    "--v472-vignette": tokens.postFx.vignette,
    "--v472-grain": tokens.postFx.grain,
    "--v472-chromatic": tokens.postFx.chromaticAberration,
    "--v472-ink": tokens.researchHud.ink,
    "--v472-panel": tokens.researchHud.panel,
    "--v472-grid": tokens.researchHud.grid,
    "--v472-short": tokens.researchHud.shortAuthority,
    "--v472-coordinate": tokens.researchHud.coordinateAuthority,
    "--v472-analytic": tokens.researchHud.analyticFixture,
    "--v472-unavailable": tokens.researchHud.unavailable,
    "--v472-title-tracking": tokens.researchHud.titleTrackingEm + "em",
  } as CSSProperties;
  const stageStyle = {
    filter:
      "brightness(" +
      tokens.strongGravity.exposure +
      ") saturate(" +
      (1 + tokens.strongGravity.colorGradeIntensity) +
      ")",
  } as CSSProperties;
  const diskStyle = {
    boxShadow:
      "0 0 " +
      tokens.strongGravity.bloomIntensity * 120 +
      "px color-mix(in srgb, var(--v472-disk-hot) 70%, transparent)",
  } as CSSProperties;
  const chromaticStyle = {
    textShadow:
      tokens.postFx.chromaticAberration > 0
        ? "1px 0 rgba(34,211,238,.35), -1px 0 rgba(251,113,133,.28)"
        : "none",
  } as CSSProperties;

  return (
    <section
      className="relative mt-6 overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(155deg,var(--v472-panel),#020506_62%,var(--v472-sky-zenith))] p-5 font-mono text-[var(--v472-ink)] shadow-[0_46px_160px_rgba(0,0,0,.62)] transition-colors duration-500 sm:p-8"
      data-atlas-science-cinematic-v8-v472
      data-atlas-v472-profile="science-cinematic-v8-v472"
      data-atlas-v472-mode={mode}
      data-atlas-v472-linear-display={tokens.strongGravity.linearDisplay ? "true" : "false"}
      data-atlas-v472-seed={tokens.strongGravity.seed ?? "none"}
      data-atlas-v472-token-count={audit.tokenCount}
      data-atlas-v472-binding-count={audit.bindingCount}
      data-atlas-v472-scientific-field-mutation="false"
      data-atlas-v472-default-applied="false"
      data-atlas-v472-scene-revision-delta="0"
      style={style}
    >
      <header className="relative z-20 flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-6">
        <div>
          <div className="text-[9px] uppercase tracking-[.36em] opacity-45">
            V472 / Science Cinematic V8
          </div>
          <h2
            className="mt-3 max-w-4xl font-serif text-3xl sm:text-5xl"
            style={{ letterSpacing: "var(--v472-title-tracking)" }}
          >
            同一组观测量，两种光线；科学字段只有一份
          </h2>
          <p className="mt-4 max-w-3xl text-[11px] leading-6 opacity-55">
            Science 保持线性显示与零 bloom/grade/grain；Cinematic 只改变展示层，classification、
            redshift、EVPA 与 intensity 永远只读。
          </p>
        </div>
        <div className="flex border border-white/10 bg-black/30 p-1" aria-label="V8 display mode">
          {(["science", "cinematic"] as const).map((value) => (
            <button
              className={
                "px-4 py-2 text-[9px] uppercase tracking-[.18em] transition-colors " +
                (mode === value ? "bg-white/10 text-white" : "text-white/35 hover:text-white/70")
              }
              data-atlas-v472-mode-option={value}
              key={value}
              onClick={() => setMode(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </header>

      <div className="relative z-10 mt-7 grid gap-5 xl:grid-cols-[1.15fr_.85fr]" style={stageStyle}>
        <div className="relative min-h-[430px] overflow-hidden border border-white/10 bg-[linear-gradient(180deg,var(--v472-sky-zenith),var(--v472-sky-horizon))]">
          <div
            className="absolute inset-0 [background-image:radial-gradient(circle_at_12%_18%,var(--v472-catalog-point)_0_1px,transparent_1.5px),radial-gradient(circle_at_73%_22%,var(--v472-catalog-point)_0_1px,transparent_1.5px),radial-gradient(circle_at_43%_67%,var(--v472-catalog-point)_0_1px,transparent_1.5px),radial-gradient(circle_at_89%_78%,var(--v472-catalog-point)_0_1px,transparent_1.5px)]"
            data-atlas-v472-consumer="sky-primer catalog-field"
            style={{ opacity: tokens.sky.starOpacity * tokens.catalog.densityOpacity }}
          />
          <div
            className="absolute -left-[15%] top-[46%] h-20 w-[130%] -rotate-6 bg-[linear-gradient(90deg,transparent,rgba(180,220,255,.24),transparent)] blur-2xl"
            data-atlas-v472-consumer="sky-backdrop"
            style={{ opacity: tokens.sky.milkyWayOpacity }}
          />
          <div
            className="absolute left-7 top-7 h-11 w-11 rounded-full bg-[radial-gradient(circle,var(--v472-sun-core),transparent_68%)]"
            data-atlas-v472-consumer="solar-medallion"
            style={{ borderColor: tokens.solar.planetRim }}
          />
          <div
            className="absolute left-20 top-11 h-5 w-11 rounded-[50%] border border-[var(--v472-planet-rim)]"
            data-atlas-v472-consumer="planet-ring"
            style={{ opacity: tokens.solar.ringOpacity }}
          />
          <div
            className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black shadow-[inset_0_0_38px_rgba(255,255,255,.03)]"
            data-atlas-v472-consumer="strong-gravity-stage"
          />
          <div
            className="absolute left-1/2 top-1/2 h-24 w-72 -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-[50%] border-[10px] border-x-[var(--v472-disk-cool)] border-y-[var(--v472-disk-hot)] opacity-85"
            data-atlas-v472-consumer="accretion-disk-stage"
            style={diskStyle}
          />
          <div
            className="absolute left-[22%] top-[31%] h-4 w-4 rounded-full border border-[var(--v472-selection-halo)] shadow-[0_0_18px_var(--v472-selection-halo)]"
            data-atlas-v472-consumer="catalog-selection"
          />
          <div
            className="absolute bottom-8 left-8 border-l-2 border-[var(--v472-launch-plume)] pl-3 text-[8px] text-[var(--v472-launch-telemetry)]"
            data-atlas-v472-consumer="launch-marker"
          >
            LAUNCH VECTOR / PRESENTATION
          </div>
          <div
            className="absolute bottom-8 right-8 h-12 w-12 rounded-full border border-[var(--v472-exoplanet-limb)] bg-[radial-gradient(circle_at_35%_35%,var(--v472-exoplanet-atmosphere),#080b10_65%)]"
            data-atlas-v472-consumer="exoplanet-marker"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,transparent_45%,black_100%)]"
            data-atlas-v472-consumer="decorative-post-fx"
            style={{ opacity: tokens.postFx.vignette }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 [background-image:repeating-radial-gradient(circle_at_20%_30%,rgba(255,255,255,.25)_0_1px,transparent_1px_4px)]"
            style={{ opacity: tokens.postFx.grain }}
          />
          <div className="absolute left-5 top-1/2 text-[8px] uppercase tracking-[.18em] opacity-40" style={chromaticStyle}>
            {tokens.strongGravity.linearDisplay ? "LINEAR SCIENCE DISPLAY" : "SEEDED CINEMATIC DISPLAY"}
          </div>
        </div>

        <aside
          className="border border-white/10 bg-black/25 p-5"
          data-atlas-v472-consumer="observable-hud error-rail"
        >
          <div className="flex items-center justify-between text-[8px] uppercase tracking-[.2em] opacity-45">
            <span>observable HUD</span>
            <span>{tokens.researchHud.statusPulse ? "pulse / presentation" : "stable / science"}</span>
          </div>
          {!state.summary ? (
            <div className="mt-5 border-l border-white/15 pl-4 text-[9px] opacity-50">
              {state.status === "idle" || state.status === "loading"
                ? "正在读取 v471 observable authority…"
                : "Observable authority 不可用 / " + (state.reason ?? "request-failed")}
            </div>
          ) : (
            <>
              <div className="mt-5 grid max-h-56 gap-1 overflow-y-auto pr-1">
                {state.summary.rows.map((row) => (
                  <button
                    className={
                      "flex items-center justify-between border px-3 py-2 text-left text-[8px] transition-colors " +
                      (selected?.id === row.id
                        ? "border-white/25 bg-white/[.06]"
                        : "border-white/8 bg-black/10 opacity-55 hover:opacity-90")
                    }
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    type="button"
                  >
                    <span>{row.label}</span>
                    <span
                      style={{
                        color:
                          tokens.researchHud[
                            STATUS_COLOR_KEYS[row.status]
                          ],
                      }}
                    >
                      {row.available ? "available" : "unavailable"}
                    </span>
                  </button>
                ))}
              </div>
              {selected ? (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <div className="text-[9px] uppercase tracking-[.16em] opacity-45">
                    {selected.id}
                  </div>
                  <div className="mt-3 text-sm leading-6">{selected.semantics}</div>
                  <div className="mt-4 grid gap-2 text-[8px]">
                    <Row label="authority" value={selected.status} />
                    <Row label="applicability" value={selected.applicability} />
                    <Row label="records" value={String(selected.recordCount)} />
                    <Row
                      label="verification"
                      value={
                        selected.verification
                          ? selected.verification.metric
                          : selected.unavailableReason ?? "unavailable"
                      }
                    />
                    <Row label="production write" value="forbidden" />
                  </div>
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>

      <footer className="relative z-20 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[8px] uppercase tracking-[.14em] opacity-45">
        <span>
          33 / 33 tokens consumed · 13 consumers · seed {tokens.strongGravity.seed ?? "none"}
        </span>
        <span>classification · redshift · EVPA · intensity = readonly</span>
      </footer>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/7 pb-2">
      <span className="opacity-35">{label}</span>
      <span className="max-w-[65%] text-right text-[var(--v472-unavailable)]">{value}</span>
    </div>
  );
}
