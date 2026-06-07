export type MissionRiskLevel = "low" | "medium" | "high";
export type MissionValidationStatus = "pass" | "warning" | "fail";
export type MissionConstraintPreset = "conservative" | "nominal" | "aggressive";
export type MissionEphemerisMode = "live-circular" | "jpl-table" | "spice-table";
export type MissionPropagationMode = "lambert" | "cowell" | "low-thrust-collocation";

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
  modelLevel: "medium-fidelity preliminary design" | "high-fidelity preliminary audit";
  epochSimDays: number;
  gravityModel:
    | "heliocentric two-body Lambert + patched conics"
    | "Cowell multi-body propagation + patched conics";
  ephemerisSource:
    | "live simulation state with circular state propagation"
    | "JPL Horizons table interpolation"
    | "NASA/JPL NAIF SPICE DE442s table interpolation";
  lambertToleranceSeconds: number;
  candidateCount: number;
  convergedCandidateCount: number;
};

export type CowellPropagationAudit = {
  mode: "cowell";
  forceModel: string[];
  integrator: "Dormand-Prince 5(4)";
  acceptedSteps: number;
  rejectedSteps: number;
  maxPositionResidualKm: number;
  maxVelocityResidualMps: number;
  relativeEnergyDrift: number;
  minimumApproachKm: number;
  converged: boolean;
  failureReason?: string;
};

export type LowThrustControl = {
  startFraction: number;
  endFraction: number;
  throttle: number;
  direction: [number, number, number];
};

export type LowThrustSolution = {
  id: string;
  legId: string;
  method: string;
  nodes: number;
  converged: boolean;
  iterations: number;
  objective: number;
  maxDefect: number;
  terminalPositionErrorKm: number;
  terminalVelocityErrorMps: number;
  tofDays: number;
  initialMassKg: number;
  finalMassKg: number;
  propellantKg: number;
  maxThrustN: number;
  ispSeconds: number;
  controls: LowThrustControl[];
  message: string;
};

export type MissionCovarianceAudit = {
  method: "6x6 variational STM covariance";
  initialPositionSigmaKm: number;
  initialVelocitySigmaMps: number;
  processNoiseAccelerationMps2: number;
  nodeThreeSigma: Array<{
    segmentId: string;
    positionKm: number;
    velocityMps: number;
  }>;
  saturnArrivalThreeSigmaKm: number;
  bPlaneThreeSigmaKm: number;
  positiveSemidefinite: boolean;
  caveat: string;
};

export type MissionEphemerisAudit = {
  mode: MissionEphemerisMode;
  source: string;
  coverageSimDays: [number, number];
  stepDays: number;
  interpolation: string;
  liveVsTableDelta: Array<{
    body: MissionBodyId;
    positionDeltaKm: number;
    velocityDeltaMps: number;
  }>;
  segmentStateSources: Array<{
    segmentId: string;
    departureBody: MissionBodyId;
    arrivalBody: MissionBodyId;
    departureSimDay: number;
    arrivalSimDay: number;
    source: string;
  }>;
  caveat: string;
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
  solverFailureReason?: string;
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
  departurePositionAu: [number, number, number];
  arrivalPositionAu: [number, number, number];
  departureVelocityAuPerDay: [number, number, number];
  arrivalVelocityAuPerDay: [number, number, number];
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
  ephemerisAudit: MissionEphemerisAudit;
  sensitivitySummary: MissionSensitivitySummary | null;
  propagationMode: MissionPropagationMode;
  cowellAudit: CowellPropagationAudit | null;
  lowThrustSolutions: LowThrustSolution[];
  covarianceAudit: MissionCovarianceAudit | null;
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
  ephemerisMode?: MissionEphemerisMode;
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
