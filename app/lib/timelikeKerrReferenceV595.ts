import admissionJson from "../../public/data/post-v593-stellar-relativity/timelike-kerr-reference-v595.json";

export type TimelikeKerrFixtureIdV595 = "bound" | "capture" | "scatter" | "escape";

export type TimelikeKerrInvariantVectorV595 = Readonly<{
  energy: number;
  axialAngularMomentum: number;
  carterQ: number;
  hamiltonian: number;
  massShellResidual: number;
}>;

export type TimelikeKerrFixtureV595 = Readonly<{
  id: TimelikeKerrFixtureIdV595;
  classification: TimelikeKerrFixtureIdV595;
  expectedClassification: TimelikeKerrFixtureIdV595;
  qualified: true;
  spin: number;
  invariants: Readonly<{
    initial: TimelikeKerrInvariantVectorV595;
    terminal: TimelikeKerrInvariantVectorV595;
    maxAbsoluteDrift: Readonly<{
      energy: number;
      axialAngularMomentum: number;
      carterQ: number;
      hamiltonian: number;
    }>;
    maxMassShellResidual: number;
    computedFromTrajectory: true;
  }>;
  dynamics: Readonly<{
    dynamicThetaSpan: number;
    dynamicPThetaSpan: number;
    radialTurningPointCount: number;
    polarTurningPointCount: number;
    status: string;
  }>;
  gates: Readonly<Record<string, true>>;
  residuals: Readonly<Record<string, number>>;
}>;

export type TimelikeKerrAnalyticAnchorV595 = Readonly<{
  id: string;
  family: string;
  qualified: true;
  radius: number;
  spin: number;
  expected: TimelikeKerrInvariantVectorV595;
  observed: TimelikeKerrInvariantVectorV595;
  maxInvariantResidual: number;
  maxRhsEquilibriumResidual: number;
  maxOrbitStabilityResidual: number;
}>;

export type TimelikeKerrReferenceV595 = Readonly<{
  version: "v595-timelike-kerr-web-admission-v1";
  status: "admitted-reference-candidate-not-promoted";
  admissionSha256: string;
  source: Readonly<{
    manifestSha256: string;
    summarySha256: string;
    sourceSha256: string;
    formatsVerified: readonly ["JSON", "HDF5", "FITS"];
    pythonCanonicalSealVerified: true;
    externalVerifierStatus: "passed-readonly-v595-timelike-kerr-json-hdf5-fits";
    externalVerifierWritesPerformed: false;
  }>;
  contract: Readonly<{
    schemaVersion: "orbit-timelike-kerr-reference/v595";
    coordinates: "Boyer-Lindquist-canonical-phase-space";
    metric: "Kerr";
    hamiltonian: "H=0.5*g^(mu,nu)*p_mu*p_nu";
    timelikeMassShell: -0.5;
    stateOrder: readonly ["t", "r", "theta", "phi", "p_t", "p_r", "p_theta", "p_phi"];
    invariantOrder: readonly ["energy", "axialAngularMomentum", "carterQ", "hamiltonian", "massShellResidual"];
  }>;
  fixtures: readonly TimelikeKerrFixtureV595[];
  analyticAnchors: readonly TimelikeKerrAnalyticAnchorV595[];
  gates: Readonly<Record<string, true>>;
  authority: Readonly<{
    defaultWebKernel: "legacy-eih-1pn";
    v2Mode: "shadow-only";
    referenceCandidateEvidence: true;
    formalEvidence: false;
    promotion: "none";
    scientificAuthorityGranted: false;
    measuredAuthorityGranted: false;
    gpuAuthorityGranted: false;
    radiativeTransferAuthorityGranted: false;
    grmhdAuthorityGranted: false;
    productionAuthorityGranted: false;
    webTeachingKernelModified: false;
    scientificPayloadMutationAllowed: false;
  }>;
  boundary: string;
}>;

const FIXTURE_ORDER: readonly TimelikeKerrFixtureIdV595[] = [
  "bound",
  "capture",
  "scatter",
  "escape",
];

function admitTimelikeKerrReferenceV595(value: unknown): TimelikeKerrReferenceV595 {
  const candidate = value as TimelikeKerrReferenceV595;
  const valid = candidate.version === "v595-timelike-kerr-web-admission-v1"
    && candidate.status === "admitted-reference-candidate-not-promoted"
    && candidate.source?.pythonCanonicalSealVerified === true
    && candidate.source?.externalVerifierWritesPerformed === false
    && candidate.contract?.schemaVersion === "orbit-timelike-kerr-reference/v595"
    && candidate.contract?.coordinates === "Boyer-Lindquist-canonical-phase-space"
    && candidate.contract?.timelikeMassShell === -0.5
    && JSON.stringify(candidate.fixtures?.map(({ id }) => id)) === JSON.stringify(FIXTURE_ORDER)
    && candidate.fixtures.every((fixture) => fixture.qualified === true)
    && candidate.analyticAnchors?.length === 3
    && candidate.analyticAnchors.every((anchor) => anchor.qualified === true)
    && candidate.gates?.allQualified === true
    && candidate.authority?.defaultWebKernel === "legacy-eih-1pn"
    && candidate.authority?.v2Mode === "shadow-only"
    && candidate.authority?.formalEvidence === false
    && candidate.authority?.promotion === "none"
    && candidate.authority?.scientificAuthorityGranted === false
    && candidate.authority?.measuredAuthorityGranted === false
    && candidate.authority?.gpuAuthorityGranted === false
    && candidate.authority?.productionAuthorityGranted === false
    && candidate.authority?.scientificPayloadMutationAllowed === false;
  if (!valid) throw new Error("v595-timelike-kerr-reference-admission-invalid");
  return candidate;
}

export const TIMELIKE_KERR_REFERENCE_V595 = admitTimelikeKerrReferenceV595(admissionJson);

export const TIMELIKE_KERR_REFERENCE_SUMMARY_V595 = Object.freeze({
  fixtureCount: TIMELIKE_KERR_REFERENCE_V595.fixtures.length,
  analyticAnchorCount: TIMELIKE_KERR_REFERENCE_V595.analyticAnchors.length,
  allQualified: TIMELIKE_KERR_REFERENCE_V595.gates.allQualified,
  admissionSha256: TIMELIKE_KERR_REFERENCE_V595.admissionSha256,
  manifestSha256: TIMELIKE_KERR_REFERENCE_V595.source.manifestSha256,
  summarySha256: TIMELIKE_KERR_REFERENCE_V595.source.summarySha256,
  sourceSha256: TIMELIKE_KERR_REFERENCE_V595.source.sourceSha256,
  formalEvidence: TIMELIKE_KERR_REFERENCE_V595.authority.formalEvidence,
  promotion: TIMELIKE_KERR_REFERENCE_V595.authority.promotion,
});
