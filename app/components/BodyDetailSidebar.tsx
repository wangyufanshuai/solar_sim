"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { BODY_DISPLAY_FACTS } from "../data/bodyDisplayFacts";
import {
  hdTextureManifestEntryForBodyId,
  v49TextureManifestEntryForBodyId,
} from "../data/planetTextureManifest";
import { SOLAR_SYSTEM_BODIES, type SolarSystemBodyDef } from "../data/planetsJ2000";
import type { BodyLiveMetrics } from "../lib/bodyLiveMetrics";
import type { SimulationDiagnostics } from "../lib/simulationDiagnosticsTypes";
import type { SolarSystemPhysicsRef } from "../lib/solarSystemRef";
import type { TelemetrySeriesState } from "../lib/telemetryTypes";
import { createBodyVisualPreviewProfile } from "../lib/atlasCloseupPresentationTruth";
import { atlasSafeRectFromOccluder } from "../lib/atlasCameraFrameSolverV4";
import { atlasRuntimeStore } from "../lib/atlasRuntimeStore";
import { resolveAtlasAsset } from "../lib/atlasAssetResolver";

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
    <div className="science-metric-row text-[11px]">
      <span>{label}</span>
      <span className="science-mono text-right">{value}</span>
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

function BodyVisualProfilePreview({ def }: { def: SolarSystemBodyDef }) {
  const profile = createBodyVisualPreviewProfile({
    id: def.id,
    variant: def.variant,
    showRings: def.showRings,
    textureMap: def.textureMap,
  });
  const hdManifest = hdTextureManifestEntryForBodyId(def.id);
  const v49Manifest = v49TextureManifestEntryForBodyId(def.id);
  const texture = profile.renderProfile === "solar-procedural-preview"
    ? undefined
    : v49Manifest.albedo ?? hdManifest.albedo ?? def.textureMap;
  const baseColor = def.color ?? (profile.renderProfile === "solar-procedural-preview" ? "#ff9d42" : "#94a3b8");
  const size = profile.ringState === "ringed" ? 82 : profile.renderProfile === "solar-procedural-preview" ? 82 : 72;
  const materialDescription = previewMaterialDescription(profile.renderProfile, Boolean(texture));
  const resolvedTexture = texture ? resolveAtlasAsset(texture).primaryUrl : undefined;
  const sphereBackground = previewSphereBackground(profile.renderProfile, baseColor, resolvedTexture);

  return (
    <div
      className="relative mt-4 overflow-hidden rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_50%_38%,rgba(122,144,170,0.12),rgba(12,15,24,0.74)_48%,rgba(0,0,0,0.88)_100%)] px-4 py-4"
      data-atlas-body-preview-id={profile.bodyId}
      data-atlas-body-preview-profile={profile.renderProfile}
      data-atlas-body-preview-texture-policy={profile.texturePolicy}
      data-atlas-body-preview-ring-state={profile.ringState}
    >
      <div className="absolute inset-0 opacity-40 [background:linear-gradient(120deg,transparent,rgba(255,255,255,0.06),transparent)]" />
      <div className="relative flex items-center gap-4">
        <div className="relative grid h-[104px] w-[112px] place-items-center">
          {profile.ringState === "ringed" ? (
            <div
              className="absolute h-[45px] w-[126px] rotate-[-15deg] rounded-full border border-[#d9c593]/75 bg-[radial-gradient(ellipse_at_center,transparent_39%,rgba(236,216,164,0.50)_42%,rgba(178,150,102,0.28)_52%,rgba(42,34,25,0.0)_66%),linear-gradient(90deg,transparent,rgba(255,244,208,0.30),transparent)] shadow-[0_0_22px_rgba(217,190,132,0.20)]"
              aria-hidden
            />
          ) : null}
          <div
            className="relative overflow-hidden rounded-full shadow-[inset_-20px_-14px_28px_rgba(0,0,0,0.78),inset_10px_8px_20px_rgba(255,255,255,0.16),0_0_24px_rgba(170,190,220,0.18)]"
            style={{
              width: size,
              height: size,
              backgroundColor: baseColor,
              backgroundImage: sphereBackground,
              backgroundSize: texture ? "210% 100%, 100% 100%, 100% 100%" : "cover",
              backgroundPosition: texture ? "42% 50%" : "center",
            }}
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_24%,rgba(255,255,255,0.24),transparent_22%),radial-gradient(circle_at_82%_74%,rgba(0,0,0,0.62),transparent_48%)]" />
            {profile.renderProfile === "earth-cloud-night-preview" ? (
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_78%_68%,rgba(70,150,255,0.28),transparent_20%),radial-gradient(circle_at_70%_66%,rgba(255,210,120,0.22),transparent_18%),linear-gradient(120deg,rgba(255,255,255,0.24),transparent_36%)] mix-blend-screen opacity-70" />
            ) : null}
            {profile.renderProfile === "solar-procedural-preview" ? (
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_42%_34%,rgba(255,232,128,0.34),transparent_24%),radial-gradient(circle_at_62%_58%,rgba(126,32,8,0.28),transparent_30%)]" />
            ) : null}
          </div>
          {profile.renderProfile === "solar-procedural-preview" ? (
            <div className="absolute h-[106px] w-[106px] rounded-full bg-[#ffb35c]/25 blur-xl" aria-hidden />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="science-section-title">视觉配置</div>
          <div className="mt-2 truncate text-[15px] font-medium text-white/90">{def.name}</div>
          <div className="mt-1 text-[11px] leading-5 text-slate-400">
            {materialDescription}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-white/55">
            <span className="rounded-full border border-white/10 px-2 py-1">
              半径标记 {def.radiusScene.toFixed(3)}
            </span>
            <span className="rounded-full border border-white/10 px-2 py-1">
              {profile.ringState === "ringed" ? "环系统" : "无环"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function previewSphereBackground(
  profile: string,
  baseColor: string,
  texture?: string,
): string {
  if (profile === "solar-procedural-preview") {
    return [
      "radial-gradient(circle at 35% 28%, rgba(255,244,166,0.72), transparent 24%)",
      "radial-gradient(circle at 58% 64%, rgba(112,32,8,0.34), transparent 34%)",
      "repeating-linear-gradient(12deg, rgba(255,190,70,0.34) 0 5px, rgba(174,54,16,0.24) 6px 10px)",
      "linear-gradient(135deg, #ffbd54, #c94c17 54%, #3f1509)",
    ].join(",");
  }
  if (texture) {
    const bandOverlay =
      profile === "gas-giant-band-preview" || profile === "saturn-ringed-band-preview"
        ? "repeating-linear-gradient(0deg, rgba(255,238,190,0.20) 0 7px, rgba(93,54,38,0.22) 8px 15px, rgba(214,170,112,0.18) 16px 24px)"
        : "linear-gradient(120deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02) 38%, rgba(0,0,0,0.54) 82%)";
    return `url(${texture}), ${bandOverlay}, linear-gradient(135deg, ${baseColor}, #101827)`;
  }
  return `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.36), transparent 22%), linear-gradient(135deg, ${baseColor}, #111827)`;
}

function previewMaterialDescription(profile: string, hasTexture: boolean): string {
  switch (profile) {
    case "solar-procedural-preview":
      return "太阳程序颗粒预览，匹配当前太阳近景 profile。";
    case "earth-cloud-night-preview":
      return "本地地球纹理预览，包含云层与暗面夜光提示。";
    case "gas-giant-band-preview":
      return "本地气态巨行星纹理预览，强化条带层次。";
    case "saturn-ringed-band-preview":
      return "本地土星纹理与环系预览，包含 Cassini 间隙提示。";
    case "lunar-mars-relief-preview":
      return hasTexture ? "本地月球/火星纹理预览，强调终结线 relief。" : "程序月球/火星 relief 回退预览。";
    case "terrestrial-texture-preview":
      return hasTexture ? "本地类地行星纹理预览，包含近景光照提示。" : "程序类地行星色彩回退预览。";
    default:
      return hasTexture ? "本地纹理预览，绑定当前选中天体。" : "程序色彩回退预览，绑定当前选中天体。";
  }
}

export default function BodyDetailSidebar({
  bodyMetricsRef,
  simulationDiagnosticsRef,
  relativityEnabled,
  simDaysRef,
  daysPerSecond,
  selectedBodyIndex,
  onDismiss,
}: BodyDetailSidebarProps) {
  const [metrics, setMetrics] = useState<BodyLiveMetrics | null>(null);
  const [diag, setDiag] = useState<SimulationDiagnostics | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (selectedBodyIndex === null) return;
    const id = window.setInterval(() => {
      setMetrics(bodyMetricsRef.current);
      setDiag(simulationDiagnosticsRef.current);
    }, 250);
    return () => window.clearInterval(id);
  }, [bodyMetricsRef, selectedBodyIndex, simulationDiagnosticsRef]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || selectedBodyIndex === null) return;
    const publishSafeRect = () => {
      const dockHeight = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--ui-dock-height"),
      ) || 78;
      atlasRuntimeStore.setSafeViewportRect(atlasSafeRectFromOccluder({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        occluder: panel.getBoundingClientRect(),
        dockHeight,
      }));
    };
    publishSafeRect();
    const animationFrame = window.requestAnimationFrame(publishSafeRect);
    const settleTimer = window.setTimeout(publishSafeRect, 420);
    panel.addEventListener("transitionend", publishSafeRect);
    const observer = new ResizeObserver(publishSafeRect);
    observer.observe(panel);
    window.addEventListener("resize", publishSafeRect, { passive: true });
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      panel.removeEventListener("transitionend", publishSafeRect);
      observer.disconnect();
      window.removeEventListener("resize", publishSafeRect);
      atlasRuntimeStore.setSafeViewportRect(null);
    };
  }, [selectedBodyIndex]);

  const def =
    selectedBodyIndex !== null ? SOLAR_SYSTEM_BODIES[selectedBodyIndex] : null;
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

  return (
    <aside
      ref={panelRef}
      className="pointer-events-auto fixed inset-x-3 bottom-[86px] top-auto z-[90] max-h-[42dvh] w-auto overflow-hidden rounded-[18px] border border-white/10 bg-black/72 shadow-[0_28px_80px_rgba(0,0,0,0.46)] backdrop-blur-xl transition-[opacity,transform] duration-200 sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-h-[calc(100dvh-2rem)] sm:w-[min(318px,calc(100vw-2rem))] sm:rounded-[22px]"
      data-atlas-body-detail-sidebar="true"
      data-atlas-camera-safe-occluder="body-detail"
    >
      <div className="border-b border-white/8 px-4 py-3 sm:py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="science-section-title">观测</div>
            <h2 className="mt-1 truncate text-[19px] font-medium tracking-[0.02em] text-slate-50 sm:mt-2 sm:text-[22px]">
              {def.name}
            </h2>
            <p className="mt-1 text-[11px] tracking-[0.16em] text-slate-400">
              {headline} / 锁定检查
            </p>
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
        <div className="hidden sm:block">
          <BodyVisualProfilePreview def={def} />
        </div>
      </div>

      <div className="max-h-[calc(42dvh-94px)] space-y-3 overflow-y-auto px-4 py-3 sm:max-h-[calc(100dvh-235px)] sm:space-y-4 sm:py-4">
        <section className="science-panel px-3 py-3">
          <div className="science-section-title mb-2">实时</div>
          <div className="space-y-1">
            <MetricRow
              label="速度"
              value={metrics ? `${metrics.speedKms.toFixed(2)} km/s` : "--"}
            />
            <MetricRow
              label="距太阳"
              value={metrics ? `${metrics.distSunAu.toFixed(4)} AU` : "--"}
            />
            <MetricRow
              label="相机距离"
              value={metrics ? `${metrics.distCameraAu.toFixed(4)} AU` : "--"}
            />
            <MetricRow label="模拟日" value={simDaysRef.current.toFixed(2)} />
            <MetricRow label="时间倍率" value={`${daysPerSecond.toFixed(1)} 天/秒`} />
            <MetricRow label="相对论" value={relativityEnabled ? "EIH 1PN 开启" : "牛顿"} />
          </div>
        </section>

        <section className="science-panel px-3 py-3">
          <div className="science-section-title mb-2">物理参考</div>
          <div className="space-y-1">
            <MetricRow label="视觉半径标记" value={def.radiusScene.toFixed(3)} />
            <MetricRow label="材质" value={def.textureMap ? "纹理 + PBR" : "程序 + PBR"} />
            <MetricRow label="行星环" value={def.showRings ? "存在" : "无"} />
            <MetricRow label="轨道色" value={def.orbitColor.toUpperCase()} />
          </div>
        </section>

        {fact ? (
          <section className="science-panel px-3 py-3">
            <div className="science-section-title mb-2">参考事实</div>
            <div className="space-y-1">
              <MetricRow label="平均半径" value={`${fact.equatorialRadiusKm.toLocaleString()} km`} />
              <MetricRow label="密度" value={`${fact.densityGcm3.toFixed(2)} g/cm^3`} />
              <MetricRow label="表面重力" value={`${fact.surfaceGravityMs2.toFixed(2)} m/s^2`} />
              <MetricRow label="自转周期" value={`${fact.rotationPeriodHours.toFixed(2)} h`} />
              <MetricRow label="平均温度" value={`${fact.meanTempC} C`} />
              <MetricRow label="年龄" value={`${fact.ageGyears.toFixed(1)} Gyr`} />
            </div>
          </section>
        ) : null}

        {diag ? (
          <section className="science-panel px-3 py-3">
            <div className="science-section-title mb-2">诊断</div>
            <div className="space-y-1">
              <MetricRow label="能量漂移" value={diag.relEnergyDrift.toExponential(2)} />
              <MetricRow label="角动量漂移" value={diag.relAngMomDrift.toExponential(2)} />
              <MetricRow label="相对论置信" value={diag.relativityConfidence} />
              <MetricRow label="强场内核" value={diag.strongFieldValidation.kernel} />
              <MetricRow label="强场状态" value={diag.strongFieldValidationStatus} />
            </div>
          </section>
        ) : null}
      </div>
    </aside>
  );
}
