/**
 * TypeScript types for launch telemetry data.
 *
 * These types mirror the Python binary protocol from launch_server.py.
 */

/** Single telemetry sample decoded from a binary WebSocket frame. */
export type LaunchTelemetrySample = {
  t: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  massKg: number;
  mach: number;
  altitudeM: number;
  dynamicPressurePa: number;
  lorentzGamma: number;
};

/** Flight phase labels matching spacecraftAutopilot.ts + deep-space extension. */
export type LaunchPhase =
  | "idle"
  | "prelaunch"
  | "verticalRise"
  | "gravityTurn"
  | "circularization"
  | "coast"
  | "deepSpace"
  | "descent"
  | "landed";

/** A notable launch event (Max-Q, staging, orbit insertion, etc.). */
export type LaunchEvent = {
  type: "maxQ" | "staging" | "orbitInsertion" | "engineCutoff";
  t: number;
  altitudeM: number;
  velocityMs: number;
  data?: Record<string, number>;
};

/** Launch profile metadata from the backend. */
export type LaunchProfile = {
  id: string;
  name: string;
  target_altitude_m: number;
  vehicle: string;
  description: string;
};

/** Launch site metadata from the backend. */
export type LaunchSiteInfo = {
  name: string;
  lat_deg: number;
  lon_deg: number;
};

/** The complete launch simulation state, consumed by UI and rendering. */
export type LaunchSimState = {
  phase: LaunchPhase;
  currentSample: LaunchTelemetrySample | null;
  maxQPa: number;
  maxQAltitudeM: number;
  maxQTimeS: number;
  trajectoryPoints: Float32Array;
  trajectoryCount: number;
  events: LaunchEvent[];
  isConnected: boolean;
  isStreaming: boolean;
  isPaused: boolean;
  timeScale: number;
  simDurationS: number;
};

/** Initial empty state. */
export const INITIAL_LAUNCH_STATE: LaunchSimState = {
  phase: "idle",
  currentSample: null,
  maxQPa: 0,
  maxQAltitudeM: 0,
  maxQTimeS: 0,
  trajectoryPoints: new Float32Array(0),
  trajectoryCount: 0,
  events: [],
  isConnected: false,
  isStreaming: false,
  isPaused: false,
  timeScale: 10,
  simDurationS: 0,
};

/** Config for starting a launch. */
export type LaunchMissionMode =
  | "leo"
  | "lunar_flyby"
  | "lunar_landing"
  | "gateway_logistics"
  | "mars_cargo"
  | "mars_crew";

export type LaunchConfig = {
  profile?: string;
  site?: string;
  target_altitude_m?: number;
  vehicle?: string;
  timeScale?: number;
  missionMode?: LaunchMissionMode;
  missionName?: string;
  destination?: "LEO" | "Moon" | "Gateway" | "Mars";
  payloadName?: string;
  crewCount?: number;
  cargoMassKg?: number;
  transferWindowDays?: number;
  targetInclinationDeg?: number;
  departureC3Km2S2?: number;
};
