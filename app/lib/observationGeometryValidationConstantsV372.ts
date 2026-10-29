/** Client-safe constants shared with the server-side v372 SHA validator. */
export const OBSERVATION_GEOMETRY_VALIDATION_VERSION_V372 =
  "v372-independent-observation-geometry-validation-v1" as const;

export const OBSERVATION_GEOMETRY_VALIDATION_GATES_V372 = Object.freeze({
  minimumRepeatCount: 3,
  maximumRepeatCoefficientOfVariation: 0.005,
  maximumStandardizedResidual: 5,
  maximumCandidateReconstructionRelativeDifference: 1e-12,
} as const);
