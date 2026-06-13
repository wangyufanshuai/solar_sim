"use client";

import { ChevronDown, ChevronLeft, Menu } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { NEARBY_STARS, starToDirection } from "../data/nearbyStars";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import { STAR_CLUSTERS } from "../data/starClusterCatalog";
import { PULSARS } from "../data/pulsarCatalog";
import { MAJOR_GAIA_STARS } from "../data/majorGaiaStars";
import { galacticToEquatorial } from "../lib/galacticToEquatorial";
import type { BottomControlBarSection } from "./BottomControlBar";
import type { SimulationViewSettings } from "../lib/simulationViewSettings";
import SpacecraftGalleryPanel from "./SpacecraftGalleryPanel";
import {
  CINEMATIC_CAMERA_PRESETS,
  dispatchCinematicCameraTour,
  dispatchCinematicCameraPreset,
} from "../lib/cinematicCamera";
import {
  CINEMATIC_POST_PROFILES,
  type CinematicPostProfileId,
} from "../lib/cinematicPostProfile";

type Props = {
  activeSection: BottomControlBarSection;
  searchFocusNonce: number;
  selectedBodyIndex: number | null;
  onBodyFocus: (bodyIndex: number) => void;
  onBodyInspect: (bodyIndex: number) => void;
  onNearbyStarFocus?: (direction: [number, number, number]) => void;
  onConstellationFocus?: (direction: [number, number, number]) => void;
  viewSettings: SimulationViewSettings;
  onViewSettingsChange: (next: SimulationViewSettings) => void;
  onPerformanceSafe?: () => void;
  visualEnhance: boolean;
  onVisualEnhanceChange: (next: boolean) => void;
  cinematicPostProfile: CinematicPostProfileId;
  onCinematicPostProfileChange: (next: CinematicPostProfileId) => void;
  cinematicDofEnabled: boolean;
  onCinematicDofEnabledChange: (next: boolean) => void;
  onExportCoverFrame?: () => void;
  leftPanelCollapsed: boolean;
  onLeftPanelCollapsedChange: (collapsed: boolean) => void;
  lagrangeSpawnNonceRef: MutableRefObject<number>;
  onExportSystemState?: () => void;
  onImportSystemState?: () => void;
};

const IS = 1.0;

function ToggleRow({
  label,
  checked,
  onChange,
  cost,
  status,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  cost?: "Low" | "Medium" | "High";
  status?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/5 py-2 text-[12px] text-[rgba(215,215,215,0.82)]">
      <span className="min-w-0">
        <span className="block truncate">{label}</span>
        {(cost || status) ? (
          <span className="mt-0.5 flex flex-wrap gap-1 text-[9px] text-white/30">
            {cost ? (
              <span className={cost === "High" ? "text-amber-200/75" : cost === "Medium" ? "text-cyan-200/62" : "text-emerald-200/62"}>
                {cost}
              </span>
            ) : null}
            {status ? <span>{status}</span> : null}
          </span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-white focus:ring-0"
      />
    </label>
  );
}

function textMatch(q: string, ...parts: Array<string | undefined>): boolean {
  if (!q) return true;
  return parts.some((part) => part?.toLowerCase().includes(q));
}

export default function UniverseSandboxHud({
  activeSection,
  searchFocusNonce,
  selectedBodyIndex,
  onBodyFocus,
  onBodyInspect,
  onNearbyStarFocus,
  onConstellationFocus,
  viewSettings,
  onViewSettingsChange,
  onPerformanceSafe,
  visualEnhance,
  onVisualEnhanceChange,
  cinematicPostProfile,
  onCinematicPostProfileChange,
  cinematicDofEnabled,
  onCinematicDofEnabledChange,
  onExportCoverFrame,
  leftPanelCollapsed,
  onLeftPanelCollapsedChange,
  lagrangeSpawnNonceRef,
  onExportSystemState,
  onImportSystemState,
}: Props) {
  const [query, setQuery] = useState("");
  const [solarOpen, setSolarOpen] = useState(true);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [gaiaOpen, setGaiaOpen] = useState(false);
  const [constellationsOpen, setConstellationsOpen] = useState(false);
  const [deepSkyOpen, setDeepSkyOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchFocusNonce <= 0) return;
    onLeftPanelCollapsedChange(false);
    searchRef.current?.focus();
    searchRef.current?.select();
  }, [onLeftPanelCollapsedChange, searchFocusNonce]);

  const q = query.trim().toLowerCase();
  const filteredBodies = useMemo(
    () =>
      SOLAR_SYSTEM_BODIES.map((b, i) => ({ b, i }))
        .filter(({ b }) => textMatch(q, b.name, b.id))
        .map(({ i }) => i),
    [q],
  );
  const filteredNearby = useMemo(
    () => NEARBY_STARS.filter((star) => textMatch(q, star.name, star.id)),
    [q],
  );
  const filteredGaia = useMemo(
    () =>
      MAJOR_GAIA_STARS.filter((star) =>
        textMatch(q, star.name, star.id, star.gaiaDr3SourceId),
      ),
    [q],
  );
  const filteredConstellations = useMemo(
    () =>
      CONSTELLATION_LINES.filter((c) =>
        textMatch(q, c.name, c.nameCn, c.iauCode),
      ),
    [q],
  );
  const filteredNebulae = useMemo(
    () => NEBULAE.filter((n) => textMatch(q, n.commonName, n.subtitleCn, n.catalogName)),
    [q],
  );
  const filteredClusters = useMemo(
    () => STAR_CLUSTERS.filter((c) => textMatch(q, c.commonName, c.subtitleCn, c.catalogName)),
    [q],
  );
  const filteredPulsars = useMemo(
    () => PULSARS.filter((p) => textMatch(q, p.commonName, p.subtitleCn, p.id)),
    [q],
  );

  const patch = (p: Partial<SimulationViewSettings>) =>
    onViewSettingsChange({ ...viewSettings, ...p });
  const applyBalancedPreset = () => {
    onVisualEnhanceChange(false);
    patch({
      renderBudget: "balanced",
      highQualityRendering: false,
      showGaiaStars: false,
      showDeepSkyMarkers: false,
      showBodyLabels: false,
      showReferenceOrbits: true,
      showOrbitTrails: true,
      showOsculatingOrbits: true,
      showNebulaImages: true,
    });
  };
  const applyShowcasePreset = () => {
    onVisualEnhanceChange(true);
    patch({
      renderBudget: "quality",
      highQualityRendering: true,
      showGaiaStars: true,
      showDeepSkyMarkers: true,
      showReferenceOrbits: true,
      showOrbitTrails: true,
      showOsculatingOrbits: true,
      showNebulaImages: true,
      showConstellations: true,
    });
  };
  const applyDeepUniversePreset = () => {
    onVisualEnhanceChange(true);
    onCinematicPostProfileChange("deep-universe-v4");
    onCinematicDofEnabledChange(false);
    patch({
      renderBudget: "quality",
      highQualityRendering: true,
      showGalaxyBackground: true,
      showGaiaStars: true,
      showConstellations: true,
      showNebulaImages: true,
      showDeepSkyMarkers: true,
      showReferenceOrbits: false,
      showOrbitTrails: true,
      showOsculatingOrbits: false,
      showBodyLabels: false,
    });
  };
  const applyPerfPreset = () => {
    onPerformanceSafe?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => onLeftPanelCollapsedChange(!leftPanelCollapsed)}
        className="pointer-events-auto fixed left-3 top-3 z-[98] flex h-10 w-10 items-center justify-center rounded-[12px] border border-[var(--ui-glass-border)] bg-[rgba(4,8,16,0.72)] text-[var(--ui-text-muted)] shadow-[0_14px_36px_rgba(0,0,0,0.28)] backdrop-blur-ui transition-colors hover:bg-[rgba(8,14,26,0.86)] hover:text-[var(--ui-text-primary)]"
        aria-expanded={!leftPanelCollapsed}
        aria-controls="universe-object-browser"
        aria-label="打开对象菜单"
      >
        <Menu className="h-4 w-4" strokeWidth={IS} />
      </button>

      <aside
        id="universe-object-browser"
        className={`fixed left-0 top-0 z-[95] flex h-[100dvh] w-[min(100vw,292px)] flex-col border-r border-[var(--ui-glass-border)] bg-[rgba(4,8,16,0.84)] pb-[calc(var(--ui-dock-height)+8px+env(safe-area-inset-bottom))] pt-16 shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-ui transition-transform duration-200 ${
          leftPanelCollapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <div>
            <div className="text-[11px] tracking-[0.24em] text-white/58">OBJECTS</div>
            <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">NASA mission console</div>
          </div>
          <button
            type="button"
            onClick={() => onLeftPanelCollapsedChange(true)}
            className="rounded-full p-1 text-slate-400 transition-colors hover:text-white/75"
            aria-label="收起菜单"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={IS} />
          </button>
        </div>

        <div className="px-4 pb-3">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索行星、恒星、星座、星云"
            className="h-10 w-full rounded-[10px] border border-white/10 bg-white/[0.035] px-3 py-2 text-[12px] text-white/84 outline-none placeholder:text-white/30 focus:border-[var(--ui-glass-border-strong)]"
            aria-label="搜索对象"
          />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 text-white/70">
          <SectionHeader label="Solar System" count={filteredBodies.length} open={solarOpen} onClick={() => setSolarOpen((v) => !v)} />
          {solarOpen ? (
            <ul className="mb-3 mt-1">
              {filteredBodies.map((bodyIndex) => {
                const def = SOLAR_SYSTEM_BODIES[bodyIndex]!;
                const active = selectedBodyIndex === bodyIndex;
                return (
                  <li key={def.id}>
                    <button
                      type="button"
                      onClick={() => onBodyFocus(bodyIndex)}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        onBodyInspect(bodyIndex);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] transition-colors ${
                        active ? "bg-white/[0.08] text-white" : "text-white/62 hover:bg-white/[0.05] hover:text-white/86"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: def.orbitColor }} />
                      <span className="truncate">{def.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <SectionHeader label="Nearby Stars" count={filteredNearby.length} open={nearbyOpen} onClick={() => setNearbyOpen((v) => !v)} />
          {nearbyOpen ? (
            <ul className="mb-4 mt-1">
              {filteredNearby.map((star) => (
                <li key={star.id}>
                  <button
                    type="button"
                    onClick={() => onNearbyStarFocus?.(starToDirection(star.raHours, star.decDeg))}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white/86"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: star.color }} />
                    <span className="truncate">{star.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <SectionHeader label="Gaia DR3" count={filteredGaia.length} open={gaiaOpen} onClick={() => setGaiaOpen((v) => !v)} />
          {gaiaOpen ? (
            <ul className="mb-4 mt-1">
              {filteredGaia.map((star) => (
                <li key={star.id}>
                  <button
                    type="button"
                    onClick={() => onNearbyStarFocus?.(starToDirection(star.raDeg / 15, star.decDeg))}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white/86"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#d6e8ff]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{star.name}</span>
                      <span className="block truncate text-[9px] text-white/26">
                        DR3 {star.gaiaDr3SourceId.slice(0, 8)}... G {star.gaiaGMag.toFixed(1)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <SectionHeader label="Constellations" count={filteredConstellations.length} open={constellationsOpen} onClick={() => setConstellationsOpen((v) => !v)} />
          {constellationsOpen ? (
            <ul className="mb-4 mt-1">
              {filteredConstellations.map((c) => {
                const centroid = c.waypoints.reduce(
                  ([ra, dec], [ra2, dec2], _, arr) => [ra + ra2 / arr.length, dec + dec2 / arr.length],
                  [0, 0] as [number, number],
                );
                return (
                  <li key={c.iauCode}>
                    <button
                      type="button"
                      onClick={() => onConstellationFocus?.(starToDirection(centroid[0] / 15, centroid[1]))}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-[12px] text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white/86"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3a6090]" />
                      <span className="truncate">{c.name}</span>
                      <span className="ml-auto text-[10px] text-white/28">{c.nameCn}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <SectionHeader
            label="Deep Sky"
            count={filteredNebulae.length + filteredClusters.length + filteredPulsars.length}
            open={deepSkyOpen}
            onClick={() => setDeepSkyOpen((v) => !v)}
          />
          {deepSkyOpen ? (
            <ul className="mb-4 mt-1">
              {filteredNebulae.map((n) => (
                <DeepSkyButton
                  key={n.id}
                  label={n.commonName}
                  subtitle={n.subtitleCn}
                  color={n.color}
                  onClick={() => {
                    const [raH, decD] = galacticToEquatorial(n.galLonDeg, n.galLatDeg);
                    onNearbyStarFocus?.(starToDirection(raH, decD));
                  }}
                />
              ))}
              {filteredClusters.map((c) => (
                <DeepSkyButton
                  key={c.id}
                  label={c.commonName}
                  subtitle={c.subtitleCn}
                  color={c.color}
                  onClick={() => {
                    const [raH, decD] = galacticToEquatorial(c.galLonDeg, c.galLatDeg);
                    onNearbyStarFocus?.(starToDirection(raH, decD));
                  }}
                />
              ))}
              {filteredPulsars.map((p) => (
                <DeepSkyButton
                  key={p.id}
                  label={p.commonName}
                  subtitle={p.subtitleCn}
                  color={p.color}
                  onClick={() => {
                    const [raH, decD] = galacticToEquatorial(p.galLonDeg, p.galLatDeg);
                    onNearbyStarFocus?.(starToDirection(raH, decD));
                  }}
                />
              ))}
            </ul>
          ) : null}
        </nav>
      </aside>

      {(activeSection === "view" || activeSection === "tools") && (
        <div className="pointer-events-none fixed bottom-[calc(var(--ui-dock-height)+10px+env(safe-area-inset-bottom))] left-1/2 z-[96] w-[min(92vw,390px)] -translate-x-1/2">
          <div className="pointer-events-auto max-h-[min(70dvh,520px)] overflow-y-auto rounded-[16px] border border-[var(--ui-glass-border)] bg-[rgba(4,8,16,0.9)] px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-ui max-sm:max-h-[52dvh]">
            {activeSection === "view" ? (
              <div>
                <div className="mb-2 text-[11px] tracking-[0.22em] text-slate-400">DISPLAY LAYERS</div>
                <div className="mb-3 grid grid-cols-4 gap-1 rounded-xl bg-black/18 p-1 text-[10px]">
                  <button
                    type="button"
                    onClick={applyBalancedPreset}
                    data-solar-action="budget-balanced"
                    className={`rounded-lg px-2 py-1.5 transition-colors ${viewSettings.renderBudget === "balanced" && !viewSettings.highQualityRendering ? "bg-white/10 text-white/86" : "text-white/42 hover:text-white/70"}`}
                  >
                    Balanced
                  </button>
                  <button
                    type="button"
                    onClick={applyShowcasePreset}
                    data-solar-action="budget-quality"
                    className={`rounded-lg px-2 py-1.5 transition-colors ${viewSettings.renderBudget === "quality" || viewSettings.highQualityRendering ? "bg-white/10 text-white/86" : "text-white/42 hover:text-white/70"}`}
                  >
                    Showcase
                  </button>
                  <button
                    type="button"
                    onClick={applyPerfPreset}
                    data-solar-action="budget-safe"
                    className="rounded-lg px-2 py-1.5 text-white/42 transition-colors hover:bg-white/10 hover:text-white/78"
                  >
                    Perf
                  </button>
                  <button
                    type="button"
                    onClick={applyDeepUniversePreset}
                    data-solar-action="deep-universe-preset"
                    className={`rounded-lg px-2 py-1.5 transition-colors ${cinematicPostProfile === "deep-universe-v4" ? "bg-cyan-200/[0.12] text-cyan-100" : "text-white/42 hover:text-white/70"}`}
                  >
                    Deep
                  </button>
                </div>
                <ToggleRow label="Body labels" checked={viewSettings.showBodyLabels} onChange={(v) => patch({ showBodyLabels: v })} cost="Low" />
                <ToggleRow label="Orbit trails" checked={viewSettings.showOrbitTrails} onChange={(v) => patch({ showOrbitTrails: v })} cost="Medium" />
                <ToggleRow label="Osculating lines" checked={viewSettings.showOsculatingOrbits} onChange={(v) => patch({ showOsculatingOrbits: v })} cost="Medium" />
                <ToggleRow label="Reference orbits" checked={viewSettings.showReferenceOrbits} onChange={(v) => patch({ showReferenceOrbits: v })} cost="Low" />
                <ToggleRow label="Milky Way background" checked={viewSettings.showGalaxyBackground} onChange={(v) => patch({ showGalaxyBackground: v })} cost="Medium" status="Loaded" />
                <ToggleRow label="Gaia star layer" checked={viewSettings.showGaiaStars} onChange={(v) => patch({ showGaiaStars: v })} cost="High" status={viewSettings.renderBudget === "quality" ? "full budget" : "balanced subset"} />
                <ToggleRow label="Constellation lines" checked={viewSettings.showConstellations} onChange={(v) => patch({ showConstellations: v })} cost="Medium" />
                <ToggleRow label="Nebula imagery" checked={viewSettings.showNebulaImages} onChange={(v) => patch({ showNebulaImages: v })} cost="High" status={viewSettings.renderBudget === "quality" || viewSettings.highQualityRendering ? "core + idle full" : "core decals"} />
                <ToggleRow label="Deep-sky markers" checked={viewSettings.showDeepSkyMarkers} onChange={(v) => patch({ showDeepSkyMarkers: v })} cost="Medium" />
                <ToggleRow label="Mission trajectory" checked={viewSettings.showMissionTrajectory} onChange={(v) => patch({ showMissionTrajectory: v })} cost="Medium" />
                <ToggleRow label="Lagrange points" checked={viewSettings.showLagrangePoints} onChange={(v) => patch({ showLagrangePoints: v })} cost="Medium" />
                <ToggleRow label="Relativistic optics" checked={viewSettings.showRelativisticOptics} onChange={(v) => patch({ showRelativisticOptics: v })} cost="Medium" />
                <ToggleRow label="High-quality render" checked={viewSettings.highQualityRendering} onChange={(v) => patch({ highQualityRendering: v, renderBudget: v ? "quality" : viewSettings.renderBudget })} cost="High" status={viewSettings.highQualityRendering ? "DPR up to 1.5" : "DPR 1"} />
                <ToggleRow label="Visual enhancement" checked={visualEnhance} onChange={onVisualEnhanceChange} cost="High" />
              </div>
            ) : (
              <div>
                <div className="mb-2 text-[11px] tracking-[0.22em] text-slate-400">TOOLS</div>
                <div className="mb-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <div className="text-[9px] tracking-[0.18em] text-white/36">CINEMATIC PRESETS</div>
                    <button
                      type="button"
                      data-solar-action="cinematic-tour"
                      onClick={dispatchCinematicCameraTour}
                      className="rounded-md border border-cyan-200/14 bg-cyan-200/[0.04] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-cyan-100/68"
                    >
                      Tour
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CINEMATIC_CAMERA_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        data-solar-action={`cinematic-${preset.id}`}
                        onClick={() => dispatchCinematicCameraPreset(preset.id)}
                        className="min-h-8 rounded-lg bg-white/[0.045] px-2 py-1.5 text-left text-[10px] text-white/62 transition-colors hover:bg-white/[0.09] hover:text-white/88"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-3 border-t border-white/5 pt-3">
                  <div className="mb-1.5 text-[9px] tracking-[0.18em] text-white/36">POST PROFILE</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CINEMATIC_POST_PROFILES.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        data-solar-action={`post-${profile.id}`}
                        onClick={() => onCinematicPostProfileChange(profile.id)}
                        className={`min-h-8 rounded-lg px-2 py-1.5 text-left text-[10px] transition-colors ${
                          cinematicPostProfile === profile.id
                            ? "bg-cyan-200/[0.1] text-cyan-100"
                            : "bg-white/[0.045] text-white/62 hover:bg-white/[0.09] hover:text-white/88"
                        }`}
                      >
                        {profile.label}
                      </button>
                    ))}
                  </div>
                  <ToggleRow
                    label="Depth of field intent"
                    checked={cinematicDofEnabled}
                    onChange={onCinematicDofEnabledChange}
                    cost="Medium"
                    status="profile marker"
                  />
                  {onExportCoverFrame ? <ToolButton label="Export cover frame" onClick={onExportCoverFrame} /> : null}
                </div>
                <ToolButton
                  label="Launch Lagrange test particle"
                  onClick={() => {
                    lagrangeSpawnNonceRef.current += 1;
                  }}
                  disabled={!viewSettings.showLagrangePoints}
                />
                {onExportSystemState ? <ToolButton label="Export system state" onClick={onExportSystemState} /> : null}
                {onImportSystemState ? <ToolButton label="Import system state" onClick={onImportSystemState} /> : null}
                <button
                  type="button"
                  data-solar-action="gallery-toggle"
                  onClick={() => setGalleryOpen((open) => !open)}
                  className="mt-3 flex w-full items-center justify-between border-t border-white/5 pt-3 text-left"
                >
                  <span className="text-[11px] tracking-[0.2em] text-slate-400">SPACECRAFT GALLERY</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-white/36 transition-transform ${galleryOpen ? "rotate-180" : ""}`} />
                </button>
                {galleryOpen ? <SpacecraftGalleryPanel /> : null}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DeepSkyButton({
  label,
  subtitle,
  color,
  onClick,
}: {
  label: string;
  subtitle: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-[12px] text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white/86"
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="truncate">{label}</span>
        <span className="ml-auto text-[10px] text-white/28">{subtitle}</span>
      </button>
    </li>
  );
}

function SectionHeader({
  label,
  count,
  open,
  onClick,
}: {
  label: string;
  count: number;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] tracking-[0.18em] text-slate-400"
    >
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} strokeWidth={IS} />
      <span>{label}</span>
      <span className="ml-auto text-[10px] tracking-normal text-white/24">{count}</span>
    </button>
  );
}

function ToolButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between border-b border-white/5 py-2 text-left text-[12px] text-white/74 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-25"
    >
      <span>{label}</span>
    </button>
  );
}
