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
  visualEnhance: boolean;
  onVisualEnhanceChange: (next: boolean) => void;
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
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-white/5 py-2 text-[12px] text-[rgba(215,215,215,0.82)]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded border-white/20 bg-transparent text-white focus:ring-0"
      />
    </label>
  );
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
  visualEnhance,
  onVisualEnhanceChange,
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
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchFocusNonce <= 0) return;
    onLeftPanelCollapsedChange(false);
    searchRef.current?.focus();
    searchRef.current?.select();
  }, [onLeftPanelCollapsedChange, searchFocusNonce]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SOLAR_SYSTEM_BODIES.map((_, i) => i);
    return SOLAR_SYSTEM_BODIES.map((b, i) => ({ b, i }))
      .filter(
        ({ b }) =>
          b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q),
      )
      .map(({ i }) => i);
  }, [query]);

  const patch = (p: Partial<SimulationViewSettings>) =>
    onViewSettingsChange({ ...viewSettings, ...p });

  return (
    <>
      <button
        type="button"
        onClick={() => onLeftPanelCollapsedChange(!leftPanelCollapsed)}
        className="pointer-events-auto fixed left-3 top-3 z-[98] flex h-10 w-10 items-center justify-center rounded-full bg-black/18 text-white/55 backdrop-blur-md transition-colors hover:bg-black/28 hover:text-white/84"
        aria-expanded={!leftPanelCollapsed}
        aria-controls="universe-object-browser"
        aria-label="打开对象菜单"
      >
        <Menu className="h-4 w-4" strokeWidth={IS} />
      </button>

      <aside
        id="universe-object-browser"
        className={`fixed left-0 top-0 z-[95] flex h-[100dvh] w-[min(100vw,286px)] flex-col bg-[rgba(18,18,20,0.78)] pb-[calc(var(--ui-dock-height)+8px+env(safe-area-inset-bottom))] pt-16 shadow-[0_20px_70px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-transform duration-200 ${
          leftPanelCollapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="text-[11px] tracking-[0.24em] text-white/45">OBJECTS</div>
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
            placeholder="搜索天体"
            className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[12px] text-white/84 outline-none placeholder:text-white/28 focus:border-white/18"
            aria-label="搜索天体"
          />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 text-white/70">
          <SectionHeader
            label="太阳系"
            count={filtered.length}
            open={solarOpen}
            onClick={() => setSolarOpen((v) => !v)}
          />
          {solarOpen ? (
            <ul className="mb-3 mt-1">
              {filtered.map((bodyIndex) => {
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
                        active
                          ? "bg-white/[0.08] text-white"
                          : "text-white/62 hover:bg-white/[0.05] hover:text-white/86"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: def.orbitColor }}
                      />
                      <span className="truncate">{def.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <SectionHeader
            label="邻近恒星"
            count={NEARBY_STARS.length}
            open={nearbyOpen}
            onClick={() => setNearbyOpen((v) => !v)}
          />
          {nearbyOpen ? (
            <ul className="mb-4 mt-1">
              {NEARBY_STARS.map((star) => {
                const q = query.trim().toLowerCase();
                if (
                  q &&
                  !star.name.toLowerCase().includes(q) &&
                  !star.id.toLowerCase().includes(q)
                ) {
                  return null;
                }
                return (
                  <li key={star.id}>
                    <button
                      type="button"
                      onClick={() =>
                        onNearbyStarFocus?.(
                          starToDirection(star.raHours, star.decDeg),
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[12px] text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white/86"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: star.color }}
                      />
                      <span className="truncate">{star.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <SectionHeader
            label="GAIA DR3 STARS"
            count={MAJOR_GAIA_STARS.length}
            open={gaiaOpen}
            onClick={() => setGaiaOpen((v) => !v)}
          />
          {gaiaOpen ? (
            <ul className="mb-4 mt-1">
              {MAJOR_GAIA_STARS.map((star) => {
                const q = query.trim().toLowerCase();
                if (
                  q &&
                  !star.name.toLowerCase().includes(q) &&
                  !star.id.toLowerCase().includes(q) &&
                  !star.gaiaDr3SourceId.includes(q)
                ) {
                  return null;
                }
                return (
                  <li key={star.id}>
                    <button
                      type="button"
                      onClick={() =>
                        onNearbyStarFocus?.(
                          starToDirection(star.raDeg / 15, star.decDeg),
                        )
                      }
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
                );
              })}
            </ul>
          ) : null}

          {/* ── Constellations ── */}
          <SectionHeader
            label="星座"
            count={CONSTELLATION_LINES.length}
            open={constellationsOpen}
            onClick={() => setConstellationsOpen((v) => !v)}
          />
          {constellationsOpen ? (
            <ul className="mb-4 mt-1">
              {CONSTELLATION_LINES.map((c) => {
                const q = query.trim().toLowerCase();
                if (q && !c.name.toLowerCase().includes(q) && !c.nameCn.includes(q) && !c.iauCode.toLowerCase().includes(q)) return null;
                const centroid = c.waypoints.reduce(([ra, dec], [ra2, dec2], _, arr) => [ra + ra2 / arr.length, dec + dec2 / arr.length], [0, 0] as [number, number]);
                return (
                  <li key={c.iauCode}>
                    <button
                      type="button"
                      onClick={() => {
                        const dir = starToDirection(centroid[0] / 15, centroid[1]);
                        onConstellationFocus?.(dir);
                      }}
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

          {/* ── Deep Sky Objects ── */}
          <SectionHeader
            label="深空天体"
            count={NEBULAE.length + STAR_CLUSTERS.length + PULSARS.length}
            open={deepSkyOpen}
            onClick={() => setDeepSkyOpen((v) => !v)}
          />
          {deepSkyOpen ? (
            <ul className="mb-4 mt-1">
              {/* Nebulae */}
              {NEBULAE.map((n) => {
                const q = query.trim().toLowerCase();
                if (q && !n.commonName.toLowerCase().includes(q) && !n.subtitleCn.includes(q)) return null;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const [raH, decD] = galacticToEquatorial(n.galLonDeg, n.galLatDeg);
                        onNearbyStarFocus?.(starToDirection(raH, decD));
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-[12px] text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white/86"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: n.color }} />
                      <span className="truncate">{n.commonName}</span>
                      <span className="ml-auto text-[10px] text-white/28">{n.subtitleCn}</span>
                    </button>
                  </li>
                );
              })}
              {/* Star Clusters */}
              {STAR_CLUSTERS.map((c) => {
                const q = query.trim().toLowerCase();
                if (q && !c.commonName.toLowerCase().includes(q) && !c.subtitleCn.includes(q)) return null;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const [raH, decD] = galacticToEquatorial(c.galLonDeg, c.galLatDeg);
                        onNearbyStarFocus?.(starToDirection(raH, decD));
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-[12px] text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white/86"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.commonName}</span>
                      <span className="ml-auto text-[10px] text-white/28">{c.subtitleCn}</span>
                    </button>
                  </li>
                );
              })}
              {/* Pulsars */}
              {PULSARS.map((p) => {
                const q = query.trim().toLowerCase();
                if (q && !p.commonName.toLowerCase().includes(q) && !p.subtitleCn.includes(q)) return null;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        const [raH, decD] = galacticToEquatorial(p.galLonDeg, p.galLatDeg);
                        onNearbyStarFocus?.(starToDirection(raH, decD));
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-[12px] text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white/86"
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="truncate">{p.commonName}</span>
                      <span className="ml-auto text-[10px] text-white/28">{p.subtitleCn}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </nav>
      </aside>

      {(activeSection === "view" || activeSection === "tools") && (
        <div className="pointer-events-none fixed bottom-[calc(var(--ui-dock-height)+10px+env(safe-area-inset-bottom))] left-1/2 z-[96] w-[min(92vw,360px)] -translate-x-1/2">
          <div className="pointer-events-auto rounded-2xl bg-[rgba(18,18,20,0.88)] px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
            {activeSection === "view" ? (
              <div>
                <div className="mb-2 text-[11px] tracking-[0.22em] text-slate-400">
                  DISPLAY
                </div>
                <ToggleRow
                  label="显示名称"
                  checked={viewSettings.showBodyLabels}
                  onChange={(v) => patch({ showBodyLabels: v })}
                />
                <ToggleRow
                  label="显示轨道"
                  checked={viewSettings.showOrbitTrails}
                  onChange={(v) => patch({ showOrbitTrails: v })}
                />
                <ToggleRow
                  label="参考轨道"
                  checked={viewSettings.showReferenceOrbits}
                  onChange={(v) => patch({ showReferenceOrbits: v })}
                />
                <ToggleRow
                  label="拉格朗日点"
                  checked={viewSettings.showLagrangePoints}
                  onChange={(v) => patch({ showLagrangePoints: v })}
                />
                <ToggleRow
                  label="相对论光学"
                  checked={viewSettings.showRelativisticOptics}
                  onChange={(v) => patch({ showRelativisticOptics: v })}
                />
                <ToggleRow
                  label="视觉增强"
                  checked={visualEnhance}
                  onChange={onVisualEnhanceChange}
                />
              </div>
            ) : (
              <div>
                <div className="mb-2 text-[11px] tracking-[0.22em] text-slate-400">
                  TOOLS
                </div>
                <ToolButton
                  label="发射拉格朗日测试粒子"
                  onClick={() => {
                    lagrangeSpawnNonceRef.current += 1;
                  }}
                  disabled={!viewSettings.showLagrangePoints}
                />
                {onExportSystemState ? (
                  <ToolButton label="导出当前系统状态" onClick={onExportSystemState} />
                ) : null}
                {onImportSystemState ? (
                  <ToolButton label="导入系统状态" onClick={onImportSystemState} />
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </>
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
      <ChevronDown
        className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`}
        strokeWidth={IS}
      />
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
