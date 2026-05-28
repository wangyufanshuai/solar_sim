export type MissionRiskLevel = "low" | "medium" | "high";

export type MissionBodyId = "earth" | "venus" | "jupiter" | "saturn";

export type MissionBodySnapshot = {
  id: MissionBodyId;
  name: string;
  massKg: number;
  posAu: [number, number, number];
  velAuPerDay: [number, number, number];
};

export type MissionPhysicsSnapshot = {
  simDays: number;
  bodies: Record<MissionBodyId, MissionBodySnapshot>;
};

export type MissionSegment = {
  id: string;
  fromBody: MissionBodyId;
  toBody: MissionBodyId;
  departureDay: number;
  arrivalDay: number;
  tofDays: number;
  deltaVKms: number;
  c3Km2S2: number;
  lambertConverged: boolean;
  lambertIterations: number;
  lambertResidual: number;
  departureVinfinityKms: number;
  arrivalVinfinityKms: number;
  periapsisAltitudeKm: number;
  flybySafetyMargin: number;
  closestApproachKm: number;
  turnAngleDeg: number;
  communicationDelayMin: number;
  burnAttitude: string;
  antennaPointing: string;
  solarArrayPointing: string;
  kalmanSigmaKm: number;
  risk: MissionRiskLevel;
  trajectoryAu: [number, number, number][];
};

export type MissionPlan = {
  id: string;
  name: string;
  sequence: MissionBodyId[];
  departureDay: number;
  arrivalDay: number;
  durationDays: number;
  totalDeltaVKms: number;
  fuelEstimateKg: number;
  score: number;
  grCorrectionNote: string;
  attitudeEvents: number;
  maxCommunicationDelayMin: number;
  navigationUncertaintyKm: number;
  risk: MissionRiskLevel;
  segments: MissionSegment[];
};

export type MissionOptimizerOptions = {
  sequence: MissionBodyId[];
  departureStartDay: number;
  departureWindowDays: number;
  departureStepDays: number;
  maxCandidates: number;
  includeRelativity: boolean;
};

export type MissionOptimizationResult = {
  options: MissionOptimizerOptions;
  plans: MissionPlan[];
  bestPlan: MissionPlan | null;
  generatedAt: number;
};

export type MissionAdvisorReport = {
  summary: string;
  fuelTradeoff: string;
  gravityAssist: string;
  risk: string;
  communication: string;
  recommendation: string;
  tags: string[];
  provider?: "local" | "deepseek" | "fallback";
  model?: string;
  latencyMs?: number;
  error?: string;
};
