import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(
              ([key]) =>
                !["generatedAt", "artifactSha256", "evidenceSha256", "pointerSha256"].includes(
                  key,
                ),
            )
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifactPath =
  "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-availability.json";
const oraclePath =
  "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-oracle.json";
const contractPath =
  "dist/science/kerr-wcs-projection-availability-v441/wcs-projection-contract.json";
const evidencePath = "dist/science/orbit-atlas-shadow-v441-evidence.json";
const pointerPath = "dist/release/orbit-atlas-current-local-shadow-candidate-v441.json";
const artifact = read(artifactPath);
const oracle = read(oraclePath);
const contract = read(contractPath);
const evidence = read(evidencePath);
const pointer = read(pointerPath);
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);

if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.sourceFiles.pythonOracleFileSha256 !== fileSha(oraclePath) ||
  artifact.sourceFiles.contractFileSha256 !== fileSha(contractPath) ||
  artifact.rows.length !== 4 ||
  artifact.counts.wcsSourceCount !== 4 ||
  artifact.counts.joinedSourceCoordinateRowCount !== 24 ||
  artifact.counts.detectorProjectionCount !== 0 ||
  artifact.counts.psfModelCount !== 0 ||
  artifact.counts.rasterProductCount !== 0 ||
  artifact.maxima.pythonAstropyPixelDifference !== 0 ||
  artifact.maxima.worldRoundtripResidualM >= 1e-12 ||
  artifact.maxima.sourceCoordinateJoinResidualPixel >= 1e-12 ||
  artifact.detectorProjectionAttempted !== false ||
  artifact.psfConvolutionAttempted !== false ||
  oracle.qualification.wcsCoordinateAuthorityQualified !== true ||
  oracle.qualification.detectorProjectionBlocked !== true ||
  oracle.qualification.rasterizationBlocked !== true ||
  contract.detectorProjection.projectionAllowed !== false ||
  contract.detectorProjection.psfAvailable !== false ||
  evidence.wcsProjectionAvailability.detectorProjectionCount !== 0 ||
  evidence.wcsProjectionAvailability.psfModelCount !== 0 ||
  pointer.capabilities.v441LinearWcsCoordinateAuthority !== "qualified" ||
  pointer.capabilities.v441DetectorProjection !== "blocked" ||
  pointer.capabilities.v441PsfAuthority !== "unavailable" ||
  pointer.capabilities.v441Rasterization !== "blocked" ||
  state.status !== "incomplete-0-of-49" ||
  state.completedShardCount !== 0 ||
  state.attemptConsumed !== false ||
  state.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
) {
  throw new Error("v441-fail-closed-validation");
}

for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v441-source-manifest-mismatch:${entry.path}`);
  }
}
if (
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(
    JSON.stringify({ artifact, evidence, pointer }),
  )
) {
  throw new Error("v441-transient-evidence-leak");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v441-low-memory",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      wcsSources: 4,
      joinedCoordinates: 24,
      detectorProjection: 0,
      psfModels: 0,
      denseCampaign: state.status,
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
