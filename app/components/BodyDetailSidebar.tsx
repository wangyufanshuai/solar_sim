"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useState, type MutableRefObject } from "react";
import { BODY_DISPLAY_FACTS } from "../data/bodyDisplayFacts";
import { SOLAR_SYSTEM_BODIES, type SolarSystemBodyDef } from "../data/planetsJ2000";
import { AU_METERS, G_SI } from "../lib/physicalConstants";
import type { BodyLiveMetrics } from "../lib/bodyLiveMetrics";
import { classicalOsculatingElements, type ClassicalOsculatingElements } from "../lib/osculatingElements";
import { siderealSpinRadPerSimDayForBodyId } from "../lib/planetSiderealSpin";
import type { SimulationDiagnostics } from "../lib/simulationDiagnosticsTypes";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import { getLatestTelemetrySample, type TelemetrySeriesState } from "../lib/telemetryTypes";

type BodyDetailSidebarProps = {
  physicsRef: MutableRefObject<SolarSystemPhysicsRef | null>;
  bodyMetricsRef: MutableRefObject<BodyLiveMetrics | null>;
  simulationDiagnosticsRef: MutableRefObject<SimulationDiagnostics | null>;
  telemetrySeriesRef: MutableRefObject<TelemetrySeriesState | null>;
  relativityEnabled: boolean;
  simDaysRef: MutableRefObject<number>;
  daysPerSecond: number;
  selectedBodyIndex: number | null;
  onDismiss: () => void;
};

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/8 py-2 text-[11px] last:border-b-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-mono text-slate-100">{value}</span>
    </div>
  );
}

function bodyClass(def: SolarSystemBodyDef, selectedBodyIndex: number, moonIds: Set<string>) {
  if (def.variant === "sun") return "恒星";
  if (moonIds.has(def.id)) return "卫星";
  if (selectedBodyIndex <= 9) return "行星";
  if (def.radiusScene < 0.2) return "小天体";
  return "天体";
}

function formatMaybe(value: number | null | undefined, suffix = "", digits = 3) {
  if (!Number.isFinite(value ?? NaN)) return "--";
  return `${(value as number).toFixed(digits)}${suffix}`;
}

function au(meters: number | null | undefined, digits = 4) {
  return Number.isFinite(meters ?? NaN) ? `${((meters as number) / AU_METERS).toFixed(digits)} AU` : "--";
}

function deg(rad: number | null | undefined, digits = 2) {
  return Number.isFinite(rad ?? NaN) ? `${(((rad as number) * 180) / Math.PI).toFixed(digits)} deg` : "--";
}

function periodText(seconds: number | null | undefined) {
  if (!Number.isFinite(seconds ?? NaN) || !seconds) return "--";
  const days = seconds / 86400;
  return days > 900 ? `${(days / 365.25).toFixed(2)} yr` : `${days.toFixed(2)} days`;
}

function BodyPreview({ def }: { def: SolarSystemBodyDef }) {
  const isSun = def.variant === "sun";
  const texture = def.textureMap;
  const baseColor = def.color ?? (isSun ? "#ffe0a0" : "#94a3b8");
  const size = def.showRings ? 82 : isSun ? 78 : 70;

  return (
    <div className="relative mt-4 overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.10),rgba(255,255,255,0.025)_36%,rgba(0,0,0,0.18)_72%)] px-4 py-4">
      <div className="absolute inset-0 opacity-50 [background:linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)]" />
      <div className="relative flex items-center gap-4">
        <div className="relative grid h-[104px] w-[112px] place-items-center">
          {def.showRings ? (
            <div
              className="absolute h-[44px] w-[120px] rotate-[-16deg] rounded-full border border-[#d5c399]/70 bg-[radial-gradient(ellipse_at_center,transparent_43%,rgba(220,200,150,0.42)_45%,rgba(180,155,110,0.22)_57%,transparent_66%)] shadow-[0_0_18px_rgba(217,190,132,0.18)]"
              aria-hidden
            />
          ) : null}
          <div
            className="relative overflow-hidden rounded-full shadow-[inset_-18px_-12px_24px_rgba(0,0,0,0.72),inset_10px_8px_22px_rgba(255,255,255,0.18),0_0_24px_rgba(170,190,220,0.20)]"
            style={{
              width: size,
              height: size,
              backgroundColor: baseColor,
              backgroundImage: texture
                ? `linear-gradient(115deg,rgba(255,255,255,0.28),rgba(255,255,255,0.02)_38%,rgba(0,0,0,0.52)_78%), url(${texture})`
                : `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.36), transparent 22%), linear-gradient(135deg, ${baseColor}, #111827)`,
              backgroundSize: texture ? "190% 100%" : "cover",
              backgroundPosition: texture ? "42% 50%" : "center",
            }}
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.26),transparent_22%),radial-gradient(circle_at_80%_72%,rgba(0,0,0,0.55),transparent_48%)]" />
          </div>
          {isSun ? <div className="absolute h-[96px] w-[96px] rounded-full bg-[#ffd88a]/25 blur-xl" aria-hidden /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.26em] text-slate-500">Visual Profile</div>
          <div className="mt-2 truncate text-[15px] font-medium text-white/90">{def.name}</div>
          <div className="mt-1 text-[11px] leading-5 text-slate-400">
            {texture ? "本地贴图材质" : "程序化材质"}，近景使用视觉缩放、边缘光和阴影增强。
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/55">
            <span className="rounded-full border border-white/10 px-2 py-1">视觉半径 {def.radiusScene.toFixed(3)}</span>
            <span className="rounded-full border border-white/10 px-2 py-1">{def.showRings ? "环系统" : "无环"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BodyDetailSidebar({
  physicsRef,
  bodyMetricsRef,
  simulationDiagnosticsRef,
  telemetrySeriesRef,
  relativityEnabled,
  simDaysRef,
  daysPerSecond,
  selectedBodyIndex,
  onDismiss,
}: BodyDetailSidebarProps) {
  const [metrics, setMetrics] = useState<BodyLiveMetrics | null>(null);
  const [diag, setDiag] = useState<SimulationDiagnostics | null>(null);
  const [telemetry, setTelemetry] = useState(() =>
    telemetrySeriesRef.current ? getLatestTelemetrySample(telemetrySeriesRef.current) : null,
  );
  const [elements, setElements] = useState<ClassicalOsculatingElements | null>(null);

  useEffect(() => {
    if (selectedBodyIndex === null) return;
    const id = window.setInterval(() => {
      setMetrics(bodyMetricsRef.current);
      setDiag(simulationDiagnosticsRef.current);
      setTelemetry(telemetrySeriesRef.current ? getLatestTelemetrySample(telemetrySeriesRef.current) : null);
      const p = physicsRef.current;
      const def = SOLAR_SYSTEM_BODIES[selectedBodyIndex];
      if (!p || !def || selectedBodyIndex <= 0 || selectedBodyIndex >= p.n) {
        setElements(null);
        return;
      }
      const centralIdx = def.osculatingCentralBodyIndex ?? 0;
      const mu = G_SI * ((p.mass[centralIdx] ?? 0) + (p.mass[selectedBodyIndex] ?? 0));
      setElements(classicalOsculatingElements(p.posM, p.velM, centralIdx, selectedBodyIndex, mu));
    }, 250);
    return () => window.clearInterval(id);
  }, [bodyMetricsRef, physicsRef, selectedBodyIndex, simulationDiagnosticsRef, telemetrySeriesRef]);

  const def = selectedBodyIndex !== null ? SOLAR_SYSTEM_BODIES[selectedBodyIndex] : null;
  const fact = def ? BODY_DISPLAY_FACTS[def.id] : null;
  const moonIds = useMemo(
    () =>
      new Set([
        "moon",
        "io",
        "europa",
        "ganymede",
        "callisto",
        "titan",
        "enceladus",
        "phobos",
        "deimos",
        "triton",
        "charon",
      ]),
    [],
  );

  if (!def || selectedBodyIndex === null) return null;

  const headline = bodyClass(def, selectedBodyIndex, moonIds);
  const spinRadPerDay = siderealSpinRadPerSimDayForBodyId(def.id);
  const visualSpin = spinRadPerDay === null ? "unavailable" : "sidereal period";
  const periodDaysFallback = telemetry?.orbitalPeriodDays;

  return (
    <aside className="pointer-events-auto fixed right-4 top-4 z-[90] max-h-[calc(100dvh-2rem)] w-[min(342px,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-white/10 bg-black/68 shadow-[0_28px_80px_rgba(0,0,0,0.46)] backdrop-blur-xl">
      <div className="border-b border-white/8 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Observation</div>
            <h2 className="mt-2 truncate text-[22px] font-medium tracking-[0.02em] text-white/92">{def.name}</h2>
            <p className="mt-1 text-[11px] tracking-[0.16em] text-slate-400">{headline} / 已锁定跟随</p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/6 hover:text-white/80"
            aria-label="关闭观测面板"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>
        <BodyPreview def={def} />
      </div>

      <div className="max-h-[calc(100dvh-235px)] space-y-4 overflow-y-auto px-4 py-4">
        <section>
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">Live</div>
          <div className="rounded-[18px] bg-white/[0.035] px-3 py-2">
            <MetricRow label="速度" value={metrics ? `${metrics.speedKms.toFixed(2)} km/s` : "--"} />
            <MetricRow label="距太阳" value={metrics ? `${metrics.distSunAu.toFixed(4)} AU` : "--"} />
            <MetricRow label="距相机" value={metrics ? `${metrics.distCameraAu.toFixed(4)} AU` : "--"} />
            <MetricRow label="模拟日" value={simDaysRef.current.toFixed(2)} />
            <MetricRow label="时间倍率" value={`${daysPerSecond.toFixed(1)} 天/秒`} />
            <MetricRow label="相对论" value={relativityEnabled ? "开启" : "关闭"} />
          </div>
        </section>

        <section>
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">Orbit Parameters</div>
          <div className="rounded-[18px] bg-white/[0.035] px-3 py-2">
            <MetricRow label="半长轴" value={elements?.a && Number.isFinite(elements.a) ? au(elements.a) : "approx unavailable"} />
            <MetricRow label="偏心率" value={formatMaybe(elements?.e ?? telemetry?.eccentricity, "", 4)} />
            <MetricRow label="倾角" value={deg(elements?.inclinationRad)} />
            <MetricRow label="近日点" value={au(elements?.periapsisM)} />
            <MetricRow label="远日点" value={Number.isFinite(elements?.apoapsisM ?? NaN) ? au(elements?.apoapsisM) : "--"} />
            <MetricRow label="当前半径" value={au(elements?.currentRadiusM ?? (metrics ? metrics.distSunAu * AU_METERS : null))} />
            <MetricRow label="轨道周期" value={periodText(elements?.periodSeconds ?? (periodDaysFallback ? periodDaysFallback * 86400 : null))} />
          </div>
        </section>

        <section>
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">Time Scale</div>
          <div className="rounded-[18px] bg-white/[0.035] px-3 py-2">
            <MetricRow label="视觉自转" value={visualSpin} />
            <MetricRow label="自转周期" value={fact ? `${fact.rotationPeriodHours.toFixed(2)} h` : "--"} />
            <MetricRow label="公转周期来源" value={elements?.periodSeconds ? "osculating state vector" : telemetry ? "telemetry approximation" : "--"} />
            <MetricRow label="比例说明" value="visual radius / nonlinear distance" />
          </div>
        </section>

        <section>
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">Data Fidelity</div>
          <div className="rounded-[18px] bg-white/[0.035] px-3 py-2">
            <MetricRow label="位置状态" value="J2000 / generated ephemeris" />
            <MetricRow label="轨道线" value="osculating / sampled trail" />
            <MetricRow label="轨道参数" value={elements ? "instant state vector" : "approximate fallback"} />
            <MetricRow label="材质" value={def.textureMap ? "texture + artistic lighting" : "procedural fallback"} />
          </div>
        </section>

        <section>
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">Physical</div>
          <div className="rounded-[18px] bg-white/[0.035] px-3 py-2">
            <MetricRow label="视觉半径" value={def.radiusScene.toFixed(3)} />
            <MetricRow label="材质" value={def.textureMap ? "贴图 + PBR" : "程序色 + PBR"} />
            <MetricRow label="环系统" value={def.showRings ? "有" : "无"} />
            <MetricRow label="轨道颜色" value={def.orbitColor.toUpperCase()} />
          </div>
        </section>

        {fact ? (
          <section className="rounded-[18px] bg-white/[0.035] px-3 py-3">
            <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">Reference</div>
            <p className="text-[12px] leading-6 text-slate-300">
              平均半径 {fact.equatorialRadiusKm.toLocaleString()} km，密度 {fact.densityGcm3.toFixed(2)} g/cm3，表面重力 {fact.surfaceGravityMs2.toFixed(2)} m/s2。
            </p>
            <p className="mt-2 text-[11px] leading-5 text-slate-400">
              自转周期 {fact.rotationPeriodHours.toFixed(1)} 小时，平均温度 {fact.meanTempC} C，年龄约 {fact.ageGyears.toFixed(1)} 十亿年。
            </p>
          </section>
        ) : null}

        {diag ? (
          <section className="rounded-[18px] border border-white/8 px-3 py-3">
            <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-slate-400">Simulation</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-white/54">
              <div className="rounded-xl bg-white/[0.035] px-3 py-2">
                <div className="text-slate-500">模拟日</div>
                <div className="mt-1 font-mono text-slate-200">{diag.simDays.toFixed(2)}</div>
              </div>
              <div className="rounded-xl bg-white/[0.035] px-3 py-2">
                <div className="text-slate-500">能量漂移</div>
                <div className="mt-1 font-mono text-slate-200">{diag.relEnergyDrift.toExponential(2)}</div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
