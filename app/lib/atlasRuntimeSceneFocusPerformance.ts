export type AtlasSceneMode = "atlas" | "inspect" | "launch" | "kerr" | "exoplanet-system";

export const ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_VERSION =
  "v115-runtime-scene-focus-performance-lock" as const;
export const ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_PROFILE =
  "v115-scene-isolation-telemetry-focus-latency" as const;

export type AtlasRuntimeSceneFocusAuditId =
  | "scene-mode-isolation-lock"
  | "launch-telemetry-subscriber-lock"
  | "camera-focus-latency-lock"
  | "hidden-dom-unmount-lock"
  | "r3f-prop-stability-lock"
  | "evidence-browser-qa-lock"
  | "protected-mutation-lock";

export type AtlasRuntimeSceneFocusAudit = {
  id: AtlasRuntimeSceneFocusAuditId;
  status: "ready" | "regressed";
  measured: string;
  expected: string;
};

export type AtlasRuntimeSceneFocusSummary = {
  version: typeof ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_VERSION;
  profile: typeof ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_PROFILE;
  status: "pending-runtime-run" | "ready-runtime-scene-focus-locked" | "ready-runtime-scene-focus-blocked";
  sceneMode: AtlasSceneMode;
  sceneIsolationPolicy: "launch-exclusive-r3f-and-dom-layers";
  telemetryPolicy: "ref-subscriber-quality-hud-cadence";
  cameraFocusPolicy: "desktop-700-1000-mobile-max-1200-default-900";
  markerPolicy: "cached-root-throttled-writes";
  hiddenDomPolicy: "collapsed-browser-and-launch-nonessential-unmounted";
  r3fPropsPolicy: "memoized-shallow-stable-simulation-props";
  focusedCommand: "npm run test:atlas:runtime-scene-focus-performance";
  audits: readonly AtlasRuntimeSceneFocusAudit[];
  protectedMutation: "not-applied";
  trustedBoundary: string;
};

export const ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_BOUNDARY =
  "v115 changes presentation runtime scene mounting, telemetry subscription cadence, camera focus timing and DOM marker scheduling only. Scientific gates, fixtures, live/worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky and v75/v97/v99 budgets remain unchanged.";

export function selectAtlasSceneMode(args: {
  launchActive: boolean;
  kerrActive: boolean;
  inspectActive: boolean;
  exoplanetSystemActive?: boolean;
}): AtlasSceneMode {
  if (args.launchActive) return "launch";
  if (args.exoplanetSystemActive) return "exoplanet-system";
  if (args.kerrActive) return "kerr";
  if (args.inspectActive) return "inspect";
  return "atlas";
}

export function shouldWriteRuntimeMarker(args: {
  nowMs: number;
  lastWriteMs: number;
  intervalMs: number;
  previousValue: string;
  nextValue: string;
  force?: boolean;
}): boolean {
  if (args.force) return args.previousValue !== args.nextValue;
  return (
    args.previousValue !== args.nextValue &&
    args.nowMs - args.lastWriteMs >= Math.max(0, args.intervalMs)
  );
}

export function createAtlasRuntimeSceneFocusSummary(args: {
  sceneMode?: AtlasSceneMode;
  audits?: readonly AtlasRuntimeSceneFocusAudit[];
} = {}): AtlasRuntimeSceneFocusSummary {
  const audits = args.audits ?? [];
  const ready = audits.length > 0 && audits.every((audit) => audit.status === "ready");
  return {
    version: ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_VERSION,
    profile: ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_PROFILE,
    status: ready
      ? "ready-runtime-scene-focus-locked"
      : audits.length > 0
        ? "ready-runtime-scene-focus-blocked"
        : "pending-runtime-run",
    sceneMode: args.sceneMode ?? "atlas",
    sceneIsolationPolicy: "launch-exclusive-r3f-and-dom-layers",
    telemetryPolicy: "ref-subscriber-quality-hud-cadence",
    cameraFocusPolicy: "desktop-700-1000-mobile-max-1200-default-900",
    markerPolicy: "cached-root-throttled-writes",
    hiddenDomPolicy: "collapsed-browser-and-launch-nonessential-unmounted",
    r3fPropsPolicy: "memoized-shallow-stable-simulation-props",
    focusedCommand: "npm run test:atlas:runtime-scene-focus-performance",
    audits,
    protectedMutation: "not-applied",
    trustedBoundary: ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_BOUNDARY,
  };
}
