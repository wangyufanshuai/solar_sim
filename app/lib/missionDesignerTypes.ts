export type MissionRiskLevel = "low" | "medium" | "high";
export type MissionValidationStatus = "pass" | "warning" | "fail";
export type MissionConstraintPreset = "conservative" | "nominal" | "aggressive";
export type MissionEphemerisMode = "live-circular" | "jpl-table" | "spice-table";
export type MissionPropagationMode = "lambert" | "cowell" | "low-thrust-collocation";
export type LowThrustSolutionStatus = "converged" | "seed" | "failed" | "unavailable";
export type MissionExportFormat =
  | "report-json"
  | "report-md"
  | "csv"
  | "ccsds-oem"
  | "ccsds-opm"
  | "review-json"
  | "review-md"
  | "state-history-csv"
  | "maneuver-events-csv";

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
  stateHistory: MissionStateSample[];
  maneuverEvents: MissionManeuverEvent[];
};

export type MissionStateSample = {
  segmentId: string;
  epochTdbJd: number;
  simDay: number;
  positionKm: [number, number, number];
  velocityKmS: [number, number, number];
  massKg: number;
  integrationStatus: "initial" | "accepted" | "terminal";
};

export type MissionManeuverEvent = {
  id: string;
  segmentId: string;
  type: "injection" | "dsm";
  epochTdbJd: number;
  simDay: number;
  deltaVVectorKmS: [number, number, number];
  deltaVMagnitudeKmS: number;
  estimatedMassChangeKg: number;
  source: string;
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
  status: LowThrustSolutionStatus;
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
  gridKey?: {
    departureDay?: number;
    tofDays: number;
    constraintPreset?: MissionConstraintPreset;
    constraintsHash?: string;
    ephemerisSha256?: string;
  };
  defectSummary?: {
    maxPositionDefectKm: number;
    maxVelocityDefectMps: number;
    maxMassDefectKg: number;
  };
  terminalResidual?: {
    positionKm: number;
    velocityMps: number;
  };
  constraintResiduals?: Array<{
    id: string;
    value: number;
    limit: number;
    status: MissionValidationStatus;
  }>;
  unavailableReason?: string;
};

export type MissionWorkerProvenance = {
  worker: "missionOptimizer.worker";
  status: "queued" | "loading-spice" | "solving" | "auditing" | "done" | "error";
  spiceBinarySha256?: string;
  lowThrustMatchStatus: LowThrustSolutionStatus | "mixed" | "none";
  message?: string;
};

export type MissionWorkspaceMode = "panel" | "immersive";

export type MissionWorkflowStage = "setup" | "run" | "inspect" | "compare" | "review";

export type MissionRunProgressState = {
  status: MissionWorkerProvenance["status"] | "idle" | "cancelled";
  message: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type MissionCovarianceAudit = {
  method: "6x6 variational STM covariance";
  initialPositionSigmaKm: number;
  initialVelocitySigmaMps: number;
  processNoiseAccelerationMps2: number;
  initialCovarianceKmKmS: number[][];
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
  engineeringConstraints: MissionEngineeringConstraints;
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
  missionWorkerProvenance?: MissionWorkerProvenance;
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

export type MissionScenarioV1 = {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  epochSimDays: number;
  options: MissionOptimizerOptions;
  constraints: MissionEngineeringConstraints;
  selectedPlanId: string | null;
  notes: string[];
};

export type MissionRunRecordV1 = {
  id: string;
  scenarioId: string;
  createdAt: string;
  result: MissionOptimizationResult;
  selectedPlanId: string | null;
};

export type MissionProjectV1 = {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  activeScenarioId: string;
  scenarios: MissionScenarioV1[];
  runs: MissionRunRecordV1[];
};

export type MissionScenario = {
  schemaVersion: 2;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  epochSimDays: number;
  options: MissionOptimizerOptions;
  constraints: MissionEngineeringConstraints;
  selectedPlanId: string | null;
  notes: string[];
};

export type MissionRunRecordV2 = {
  schemaVersion: 2;
  id: string;
  scenarioId: string;
  createdAt: string;
  inputHash: string;
  solverVersion: string;
  spiceChecksum: string | null;
  constraintsSnapshot: MissionEngineeringConstraints;
  status: "completed" | "failed" | "cancelled";
  reportReadiness: "ready" | "partial" | "blocked";
  result: MissionOptimizationResult;
  selectedPlanId: string | null;
};

export type MissionRunRecord = MissionRunRecordV2;

export type MissionArtifactRecord = {
  id: string;
  runId: string;
  createdAt: string;
  format: MissionExportFormat | "project-json";
  label: string;
  checksum: string;
  bytes: number;
};

export type MissionRunNotebookEntry = {
  id: string;
  runId: string;
  createdAt: string;
  author: "local-user" | "system";
  note: string;
  decision: string;
  riskTags: string[];
  auditSnapshot: {
    verdict: MissionValidationStatus | "unavailable";
    reportReadiness: MissionRunRecordV2["reportReadiness"];
    inputHash: string;
    solverVersion: string;
    spiceChecksum: string | null;
  };
};

export type MissionRiskMetric = {
  p10: number;
  p50: number;
  p90: number;
  worst: number;
  unit: string;
};

export type MissionMonteCarloConfig = {
  seed: string;
  samples: number;
  departureSigmaDays: number;
  tofSigmaFraction: number;
  dsmReserveSigmaFraction: number;
  navigationSigmaKm: number;
  ispSigmaSeconds: number;
  dryMassSigmaKg: number;
};

export type MissionMonteCarloResult = {
  id: string;
  runId: string;
  planId: string | null;
  createdAt: string;
  config: MissionMonteCarloConfig;
  successRate: number;
  robustnessGrade: "A" | "B" | "C" | "D" | "F";
  failReasonHistogram: Record<string, number>;
  c3: MissionRiskMetric;
  deltaV: MissionRiskMetric;
  arrivalThreeSigma: MissionRiskMetric;
  minimumConstraintMargin: MissionRiskMetric;
  dominantFailureReason: string;
  preliminaryCaveat: string;
};

export type MissionReviewPackage = {
  schemaVersion: 1;
  id: string;
  createdAt: string;
  projectId: string | null;
  scenarioId: string | null;
  runId: string | null;
  planId: string | null;
  verdict: MissionValidationStatus | "unavailable";
  inputHash: string | null;
  solverVersion: string | null;
  spiceChecksum: string | null;
  reportReadiness: MissionRunRecordV2["reportReadiness"] | "unavailable";
  comparisonRows: MissionComparisonRow[];
  engineeringMatrix: MissionEngineeringMatrixRow[];
  monteCarlo: MissionMonteCarloResult | null;
  artifactRecords: MissionArtifactRecord[];
  topRisks: string[];
  exportReadiness: {
    report: boolean;
    ccsdsOem: boolean;
    ccsdsOpm: boolean;
    reviewPackage: boolean;
  };
  caveat: string;
};

export type MissionTrajectoryInspectionSample = {
  id: string;
  kind: "state" | "maneuver" | "flyby";
  segmentId: string;
  label: string;
  epochTdbJd: number;
  simDay: number;
  positionKm: [number, number, number] | null;
  velocityKmS: [number, number, number] | null;
  massKg: number | null;
  deltaVVectorKmS?: [number, number, number];
  source: string;
  nearestConstraintStatus: MissionValidationStatus | "unavailable";
};

export type MissionInspectionSelection = {
  sampleId: string | null;
  kind: MissionTrajectoryInspectionSample["kind"] | "all";
  segmentId: string | null;
  query: string;
  simDay: number | null;
  positionAu: [number, number, number] | null;
};

export type MissionProjectV2 = {
  schemaVersion: 2;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  activeScenarioId: string;
  activeRunId: string | null;
  scenarios: MissionScenario[];
  runs: MissionRunRecordV2[];
  runNotebooks?: MissionRunNotebookEntry[];
  reviewPackages?: MissionReviewPackage[];
  riskResults?: MissionMonteCarloResult[];
  artifactRecords?: MissionArtifactRecord[];
};

export type MissionProject = MissionProjectV2;

export type MissionCcsdsExportOptions = {
  originator?: string;
  objectName?: string;
  objectId?: string;
  includeCovariance?: boolean;
  includeManeuvers?: boolean;
};

export type MissionComparisonRow = {
  runId: string;
  scenarioId: string;
  createdAt: string;
  planId: string | null;
  verdict: MissionValidationStatus | "unavailable";
  c3Km2S2: number | null;
  deltaVKms: number | null;
  propellantKg: number | null;
  durationDays: number | null;
  robustnessScore: number | null;
  minimumConstraintMargin: number | null;
  cowellResidualKm: number | null;
  arrivalThreeSigmaKm: number | null;
  monteCarloSuccessRate: number | null;
  monteCarloDeltaVP50Kms: number | null;
  monteCarloWorstMargin: number | null;
  monteCarloDominantFailureReason: string | null;
  recommended: boolean;
};

export type MissionEngineeringMatrixRow = {
  planId: string;
  verdict: MissionValidationStatus;
  score: number;
  ephemerisSource: MissionSolverProvenance["ephemerisSource"];
  lambertConvergedLegs: number;
  lambertTotalLegs: number;
  cowellResidualKm: number | null;
  covarianceThreeSigmaKm: number | null;
  lowThrustStatus: LowThrustSolutionStatus | "mixed" | "none";
  minimumConstraintMargin: number;
  reportReady: boolean;
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
