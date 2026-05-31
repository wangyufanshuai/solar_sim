import type { LaunchConfig, LaunchMissionMode } from "./launchTelemetryTypes";

export type LaunchMissionProfile = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  missionMode: LaunchMissionMode;
  destination: NonNullable<LaunchConfig["destination"]>;
  vehicle: string;
  payloadName: string;
  defaultSite: string;
  targetAltitudeM: number;
  defaultTimeScale: number;
  crewCount?: number;
  cargoMassKg?: number;
  transferWindowDays?: number;
  targetInclinationDeg?: number;
  departureC3Km2S2?: number;
  objectives: string[];
  timeline: { label: string; timeS: number }[];
};

export const LAUNCH_SITES = [
  { id: "kennedy_lc39b", name: "KENNEDY LC-39B", lat: "28.6N", lon: "80.6W" },
  { id: "cape_canaveral", name: "CAPE CANAVERAL", lat: "28.5N", lon: "80.6W" },
  { id: "baikonur", name: "BAIKONUR", lat: "45.6N", lon: "63.3E" },
  { id: "vandenberg", name: "VANDENBERG SFB", lat: "34.7N", lon: "120.6W" },
  { id: "xichang", name: "XICHANG", lat: "28.25N", lon: "102.03E" },
] as const;

export const LAUNCH_MISSION_PROFILES: LaunchMissionProfile[] = [
  {
    id: "artemis_ii",
    name: "ARTEMIS II / ORION",
    shortName: "Artemis II",
    description: "SLS Block 1 crewed lunar flyby with Orion, ICPS parking orbit and TLI.",
    missionMode: "lunar_flyby",
    destination: "Moon",
    vehicle: "SLS Block 1 + Orion",
    payloadName: "Orion Crew Module",
    defaultSite: "kennedy_lc39b",
    targetAltitudeM: 185_000,
    defaultTimeScale: 16,
    crewCount: 4,
    cargoMassKg: 26_500,
    transferWindowDays: 8,
    targetInclinationDeg: 28.6,
    departureC3Km2S2: -1.8,
    objectives: ["LEO insertion", "ICPS restart", "Trans-lunar injection", "Crewed lunar flyby"],
    timeline: [
      { label: "SRB separation", timeS: 126 },
      { label: "Core MECO", timeS: 330 },
      { label: "Parking orbit", timeS: 760 },
      { label: "TLI burn", timeS: 4500 },
    ],
  },
  {
    id: "artemis_iii",
    name: "ARTEMIS III / LUNAR LANDING",
    shortName: "Artemis III",
    description: "Crewed lunar landing architecture with Orion, NRHO rendezvous and HLS transfer.",
    missionMode: "lunar_landing",
    destination: "Moon",
    vehicle: "SLS Block 1 + Orion + HLS rendezvous",
    payloadName: "Orion + surface crew",
    defaultSite: "kennedy_lc39b",
    targetAltitudeM: 185_000,
    defaultTimeScale: 18,
    crewCount: 4,
    cargoMassKg: 29_000,
    transferWindowDays: 10,
    targetInclinationDeg: 28.6,
    departureC3Km2S2: -1.4,
    objectives: ["LEO checkout", "TLI", "NRHO rendezvous", "HLS lunar descent"],
    timeline: [
      { label: "SRB separation", timeS: 126 },
      { label: "Core MECO", timeS: 330 },
      { label: "Orion systems checkout", timeS: 1800 },
      { label: "TLI burn", timeS: 4800 },
    ],
  },
  {
    id: "gateway_logistics",
    name: "GATEWAY LOGISTICS",
    shortName: "Gateway",
    description: "Cargo and station module delivery toward lunar Gateway-style high lunar orbit.",
    missionMode: "gateway_logistics",
    destination: "Gateway",
    vehicle: "SLS Block 1B Cargo",
    payloadName: "Gateway logistics module",
    defaultSite: "kennedy_lc39b",
    targetAltitudeM: 240_000,
    defaultTimeScale: 24,
    cargoMassKg: 38_000,
    transferWindowDays: 12,
    targetInclinationDeg: 28.6,
    departureC3Km2S2: -0.9,
    objectives: ["High-energy parking orbit", "Cargo checkout", "Lunar transfer", "Gateway phasing"],
    timeline: [
      { label: "SRB separation", timeS: 126 },
      { label: "Core MECO", timeS: 340 },
      { label: "Parking orbit", timeS: 900 },
      { label: "Lunar transfer", timeS: 5200 },
    ],
  },
  {
    id: "mars_cargo",
    name: "MARS CARGO CONVOY",
    shortName: "Mars Cargo",
    description: "Heavy cargo departure to Mars transfer orbit for surface power, habitats and ISRU.",
    missionMode: "mars_cargo",
    destination: "Mars",
    vehicle: "Mars transfer stack",
    payloadName: "Cargo lander + habitat kit",
    defaultSite: "kennedy_lc39b",
    targetAltitudeM: 320_000,
    defaultTimeScale: 32,
    cargoMassKg: 70_000,
    transferWindowDays: 780,
    targetInclinationDeg: 28.6,
    departureC3Km2S2: 12.5,
    objectives: ["LEO assembly orbit", "Propellant checkout", "Mars injection", "Interplanetary coast"],
    timeline: [
      { label: "Core MECO", timeS: 340 },
      { label: "Assembly orbit", timeS: 1100 },
      { label: "Mars injection", timeS: 6200 },
      { label: "Deep-space handoff", timeS: 7200 },
    ],
  },
  {
    id: "mars_crew",
    name: "MARS CREW TRANSFER",
    shortName: "Mars Crew",
    description: "Crewed Mars transit profile with higher parking orbit, longer checkout and protected habitat mass.",
    missionMode: "mars_crew",
    destination: "Mars",
    vehicle: "Crew Mars transfer vehicle",
    payloadName: "Crew habitat + return capsule",
    defaultSite: "kennedy_lc39b",
    targetAltitudeM: 400_000,
    defaultTimeScale: 28,
    crewCount: 6,
    cargoMassKg: 95_000,
    transferWindowDays: 780,
    targetInclinationDeg: 28.6,
    departureC3Km2S2: 10.8,
    objectives: ["Crew ascent", "Systems checkout", "Mars injection", "Transit habitat handoff"],
    timeline: [
      { label: "SRB separation", timeS: 126 },
      { label: "Core MECO", timeS: 340 },
      { label: "Crew checkout", timeS: 2400 },
      { label: "Mars injection", timeS: 6800 },
    ],
  },
  {
    id: "leo_validation",
    name: "LEO VALIDATION",
    shortName: "LEO Test",
    description: "Low Earth orbit shakedown for guidance, staging, Max-Q and circularization validation.",
    missionMode: "leo",
    destination: "LEO",
    vehicle: "SLS Block 1 test stack",
    payloadName: "Instrumented test payload",
    defaultSite: "kennedy_lc39b",
    targetAltitudeM: 220_000,
    defaultTimeScale: 12,
    cargoMassKg: 18_000,
    targetInclinationDeg: 28.6,
    objectives: ["Clean ascent", "Max-Q pass", "Circular orbit", "Telemetry validation"],
    timeline: [
      { label: "SRB separation", timeS: 126 },
      { label: "Core MECO", timeS: 330 },
      { label: "Orbit insertion", timeS: 760 },
    ],
  },
];

export function getLaunchMissionProfile(id: string | undefined): LaunchMissionProfile {
  return LAUNCH_MISSION_PROFILES.find((profile) => profile.id === id) ?? LAUNCH_MISSION_PROFILES[0]!;
}

export function configFromMissionProfile(
  profile: LaunchMissionProfile,
  overrides: Partial<LaunchConfig> = {},
): LaunchConfig {
  return {
    profile: profile.id,
    site: profile.defaultSite,
    target_altitude_m: profile.targetAltitudeM,
    vehicle: profile.vehicle,
    timeScale: profile.defaultTimeScale,
    missionMode: profile.missionMode,
    missionName: profile.shortName,
    destination: profile.destination,
    payloadName: profile.payloadName,
    crewCount: profile.crewCount,
    cargoMassKg: profile.cargoMassKg,
    transferWindowDays: profile.transferWindowDays,
    targetInclinationDeg: profile.targetInclinationDeg,
    departureC3Km2S2: profile.departureC3Km2S2,
    ...overrides,
  };
}
