export type MissionRiskLevel = "low" | "medium" | "high";
export type MissionValidationStatus = "pass" | "warning" | "fail";
export type MissionConstraintPreset = "conservative" | "nominal" | "aggressive";

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

export type MissionEngineeringConstraints = {
  preset: MissionConstraintPreset;
  dryMassKg: number;
  ispSeconds: number;
  parkingOrbitAltitudeKm: number;
  maxC3Km2S2: number;
  maxTotalDeltaVKms: number;
  maxDsmDeltaVKms: number;
  maxDurationDays: number;
  minVenusFlybyAltitudeKm: number;
  minJupiterFlybyAltitudeKm: number;
  maxNavigationUncertaintyKm: number;
};

export type MissionConstraintCheck = {
  id: string;
  label: string;
  actual: number;
  limit: number;
  margin: number;
  unit: string;
  status: MissionValidationStatus;
  explanation: string;
};

export type MissionSolverProvenance = {
  modelLevel: "medium-fidelity preliminary design";
  epochSimDays: number;
  gravityModel: "heliocentric two-body Lambert + patched conics";
  ephemerisSource: "live simulation state with circular state propagation";
  lambertToleranceSeconds: number;
  candidateCount: number;
  convergedCandidateCount: number;
};

export type MissionSensitivitySummary = {
  samples: number;
  departurePerturbationDays: number;
  tofPerturbationFraction: number;
  deltaVRangeKms: [number, number];
  c3RangeKm2S2: [number, number];
  minimumFlybyMarginKm: number;
  scoreRange: [number, number];
  robustnessScore: number;
};

export type MissionSegment = {
  id: string;
  fromBody: MissionBodyId;
  toBody: MissionBodyId;
  departureDay: number;
  arrivalDay: number;
  tofDays: number;
  deltaVKms: number;
  dsmDeltaVKms: number;
  c3Km2S2: number;
  lambertConverged: boolean;
  lambertIterations: number;
  lambertResidual: number;
  departureVinfinityKms: number;
  arrivalVinfinityKms: number;
  periapsisAltitudeKm: number;
  flybySafetyMargin: number;
  flybyFeasible: boolean;
  requiredTurnAngleDeg: number;
  maxTurnAngleDeg: number;
  bPlaneRisk: MissionRiskLevel;
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

export type MissionChartPoint = {
  label: string;
  day: number;
  c3Km2S2: number;
  deltaVKms: number;
  dsmDeltaVKms: number;
  departureVinfinityKms: number;
  arrivalVinfinityKms: number;
  communicationDelayMin: number;
  flybySafetyMargin: number | null;
};

export type MissionPlan = {
  id: string;
  name: string;
  sequence: MissionBodyId[];
  departureDay: number;
  arrivalDay: number;
  durationDays: number;
  totalDeltaVKms: number;
  deterministicDeltaVKms: number;
  dsmReserveDeltaVKms: number;
  fuelEstimateKg: number;
  score: number;
  grCorrectionNote: string;
  attitudeEvents: number;
  maxCommunicationDelayMin: number;
  navigationUncertaintyKm: number;
  risk: MissionRiskLevel;
  validationStatus: MissionValidationStatus;
  constraintChecks: MissionConstraintCheck[];
  assumptions: string[];
  solverProvenance: MissionSolverProvenance;
  sensitivitySummary: MissionSensitivitySummary | null;
  rejectionReasons: string[];
  segments: MissionSegment[];
  chartSeries: MissionChartPoint[];
};

export type MissionOptimizerOptions = {
  sequence: MissionBodyId[];
  departureStartDay: number;
  departureWindowDays: number;
  departureStepDays: number;
  maxCandidates: number;
  includeRelativity: boolean;
  constraintPreset: MissionConstraintPreset;
  constraints?: Partial<Omit<MissionEngineeringConstraints, "preset">>;
};

export type MissionOptimizationResult = {
  options: MissionOptimizerOptions;
  constraints: MissionEngineeringConstraints;
  plans: MissionPlan[];
  rejectedPlans: MissionPlan[];
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
