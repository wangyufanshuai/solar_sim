import type {
  KerrGeodesicRenderMode,
  KerrGeodesicTrackKind,
  KerrOrbitPresetId,
  KerrRelativityStudioMode,
} from "../lib/simulationDiagnosticsTypes";
import type { KerrRayTraceQualityV3 } from "../lib/kerrRayTraceV3";
import type { StrongGravityRenderModeV299 } from "../lib/strongGravityRenderingV299";

export const SUN_MASS_KG = 1.98847e30;

export function formatTeachingScale(value: number): string {
  return value >= 1e9 ? `${(value / 1e9).toFixed(2)} x10^9` : value.toExponential(1);
}

export function trackLabel(kind: KerrGeodesicTrackKind): string {
  switch (kind) {
    case "photon-sphere":
      return "photon sphere";
    case "isco":
      return "Schw. ISCO";
    case "capture":
      return "capture";
    case "escape":
      return "escape";
    case "kerr-prograde":
      return "Kerr prograde";
    case "kerr-retrograde":
      return "Kerr retrograde";
    case "probe-null":
      return "probe null";
  }
}

export function KerrMetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="science-metric-row">
      <span>{label}</span>
      <span className="science-mono text-right">{value}</span>
    </div>
  );
}

export const RENDER_MODE_OPTIONS: ReadonlyArray<{ value: KerrGeodesicRenderMode; label: string }> = [
  { value: "geodesic-tracks", label: "Geodesic tracks" },
  { value: "teaching-particles", label: "Teaching particles" },
  { value: "both", label: "Both" },
];

export const RAY_TRACE_QUALITY_OPTIONS: ReadonlyArray<{ value: KerrRayTraceQualityV3; label: string }> = [
  { value: "mobile-safe", label: "Mobile safe" },
  { value: "interactive", label: "Interactive" },
  { value: "science-still", label: "Science still" },
];

export function KerrStrongGravityModeControlV299({
  value,
  onChange,
}: {
  value: StrongGravityRenderModeV299;
  onChange: (mode: StrongGravityRenderModeV299) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-ui-muted">
        <span>Strong-gravity display</span>
        <span className="science-mono text-[10px] text-cyan-100/52">V299 boundary</span>
      </div>
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-white/10">
        {(["science", "cinematic"] as const).map((mode) => {
          const active = value === mode;
          return (
            <button key={mode} type="button" onClick={() => onChange(mode)} className={active
              ? "atlas-accessible-focus min-h-6 bg-cyan-300/16 px-2 py-1 text-[10px] text-cyan-100"
              : "atlas-accessible-focus min-h-6 bg-black/18 px-2 py-1 text-[10px] text-ui-muted hover:bg-white/7 hover:text-ui-primary"} aria-pressed={active}>
              {mode === "science" ? "Science · sparse authority" : "Cinematic · seeded preview"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const STUDIO_MODE_OPTIONS: ReadonlyArray<{ value: KerrRelativityStudioMode; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "probe", label: "Probe" },
  { value: "isco", label: "ISCO" },
  { value: "error", label: "Error" },
  { value: "boundary", label: "Boundary" },
];

export function studioModeForPreset(presetId: KerrOrbitPresetId): KerrRelativityStudioMode {
  switch (presetId) {
    case "isco-comparison":
    case "frame-drag-split":
      return "isco";
    case "capture-cone":
    case "wide-deflection":
      return "probe";
    case "photon-ring-demo":
    default:
      return "overview";
  }
}
