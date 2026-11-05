import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const read = (path) =>
  JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) =>
  createHash("sha256")
    .update(readFileSync(resolve(root, path)))
    .digest("hex");
const transient = new Set([
  "generatedAt",
  "artifactSha256",
  "evidenceSha256",
  "pointerSha256",
]);
const canonicalize = (value) =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value) =>
  createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");

const artifactRoot = "dist/science/kerr-detector-image-formation-v450";
const artifact = read(`${artifactRoot}/image-formation-qualification.json`);
const oracle = read(`${artifactRoot}/python-oracle.json`);
const detector = read(
  "dist/science/kerr-detector-geometry-staging-v443/staging-inspect.json",
);
const evidence = read("dist/science/orbit-atlas-shadow-v450-evidence.json");
const pointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v450.json",
);
const state = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read(
  "dist/release/orbit-atlas-current-product-evidence-v263.json",
);
const formalEvidence = read(formal.source);
const maximumOracleDifference = Math.max(
  artifact.maxima.pythonWeightAbsoluteDifference,
  artifact.maxima.pythonElectronRelativeDifference,
);
const forbiddenProducts = readdirSync(resolve(root, artifactRoot)).filter((name) =>
  [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);

if (
  sha(artifact) !== artifact.artifactSha256 ||
  sha(evidence) !== evidence.evidenceSha256 ||
  sha(pointer) !== pointer.pointerSha256 ||
  artifact.rows.length !== 4 ||
  artifact.rows.some(
    (row) =>
      row.deposits.length !== 4 ||
      row.detectorGeometryAuthority !== false ||
      row.psfAuthority !== false ||
      row.pixelResponseAuthority !== false ||
      row.scienceRasterAuthority !== false ||
      row.observedImageAvailable !== false,
  ) ||
  artifact.counts.sparseDepositRowCount !== 16 ||
  artifact.counts.measuredDetectorGeometryRows !== 0 ||
  artifact.counts.psfRows !== 0 ||
  artifact.counts.pixelResponseRows !== 0 ||
  artifact.counts.scienceRasterRows !== 0 ||
  artifact.counts.observedImageRows !== 0 ||
  artifact.maxima.weightConservationAbsolute > 1e-15 ||
  artifact.maxima.electronConservationRelative > 1e-15 ||
  maximumOracleDifference >= 1e-12 ||
  artifact.qualification.expectedElectronFormationFixtureQualified !== true ||
  artifact.qualification.detectorProjectionAuthority !== false ||
  artifact.qualification.scienceRasterAuthority !== false ||
  artifact.boundary.fullRasterMaterialized !== false ||
  artifact.boundary.pngGenerated !== false ||
  artifact.boundary.fitsGenerated !== false ||
  oracle.precisionDigits !== 60 ||
  detector.status !== "blocked-staging-directory-missing" ||
  detector.readyFileCount !== 0 ||
  pointer.capabilities.v450ExpectedElectronImageFormation !==
    "qualified-fixture-only" ||
  pointer.capabilities.v450DetectorProjectionAuthority !==
    "blocked-staging-0-of-6" ||
  pointer.capabilities.v450ScienceRasterAuthority !== "blocked" ||
  pointer.capabilities.v450ObservedImage !== "unavailable" ||
  forbiddenProducts.length !== 0 ||
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
  throw new Error("v450-fail-closed-validation");
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v450-source-manifest-mismatch:${entry.path}`);
  }
}
if (
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(
    JSON.stringify({ artifact, evidence, pointer }),
  )
) {
  throw new Error("v450-transient-evidence-leak");
}
console.log(
  JSON.stringify(
    {
      status: "passed-v450-low-memory-fail-closed",
      artifactSha256: artifact.artifactSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      sourceRows: 4,
      sparseDepositRows: 16,
      maximumOracleDifference,
      detectorProjectionAuthority: "blocked",
      scienceRasterAuthority: "blocked",
      observedImage: "unavailable",
      forbiddenImageProducts: forbiddenProducts.length,
      denseCampaign: state.status,
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
