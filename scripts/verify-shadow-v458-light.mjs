import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const read = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const fileSha = (path) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
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
const canonicalSha = (value) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const artifactRoot = "dist/science/kerr-measured-detector-intake-v458";
const intake = read(`${artifactRoot}/intake-inspect.json`);
const contract = read(`${artifactRoot}/intake-contract.json`);
const schema = read(`${artifactRoot}/schema-pack.json`);
const evidence = read("dist/science/orbit-atlas-shadow-v458-evidence.json");
const pointer = read("dist/release/orbit-atlas-current-local-shadow-candidate-v458.json");
const previousEvidence = read("dist/science/orbit-atlas-shadow-v457-evidence.json");
const previousPointer = read(
  "dist/release/orbit-atlas-current-local-shadow-candidate-v457.json",
);
const dense = read("dist/science/kerr-campaign-v314/campaign-state.json");
const formal = read("dist/release/orbit-atlas-current-product-evidence-v263.json");
const formalEvidence = read(formal.source);
const forbiddenProducts = readdirSync(resolve(root, artifactRoot)).filter((name) =>
  [".png", ".fits", ".fit", ".fts"].includes(extname(name).toLowerCase()),
);

if (
  canonicalSha(intake) !== intake.artifactSha256 ||
  canonicalSha(evidence) !== evidence.evidenceSha256 ||
  canonicalSha(pointer) !== pointer.pointerSha256 ||
  canonicalSha({
    version: schema.version,
    schemaCount: schema.schemaCount,
    schemas: schema.schemas,
  }) !== schema.schemaPackSha256 ||
  intake.contract.requiredFileCount !== 6 ||
  contract.requiredFileCount !== 6 ||
  intake.schemaPack.schemaCount !== 6 ||
  schema.schemaCount !== 6 ||
  intake.validator.qualified !== true ||
  intake.validator.acceptedSyntheticControlCount !== 1 ||
  intake.validator.syntheticControlAuthorityGranted !== false ||
  intake.validator.rejectedAdversarialFixtureCount !== 11 ||
  intake.validator.adversarialFixtures.length !== 11 ||
  intake.validator.adversarialFixtures.some(
    (fixture) =>
      fixture.rejected !== true || fixture.expectedReason !== fixture.observedReason,
  ) ||
  intake.inspect.stagingRootPresent !== false ||
  intake.inspect.files.length !== 6 ||
  intake.inspect.files.some((file) => file.status !== "missing") ||
  intake.inspect.readyFileCount !== 0 ||
  intake.inspect.missingFileIds.length !== 6 ||
  intake.inspect.candidateReadyForIndependentValidation !== false ||
  intake.inspect.attemptConsumed !== false ||
  intake.productionAdmission.measuredDetectorAuthorityGranted !== false ||
  intake.productionAdmission.runtimeProjectionAllowed !== false ||
  intake.productionAdmission.scienceRasterAllowed !== false ||
  intake.boundary.syntheticFixtureMayGrantAuthority !== false ||
  intake.boundary.fitsWriteAllowed !== false ||
  intake.boundary.pngWriteAllowed !== false ||
  intake.boundary.sciencePayloadMutationAllowed !== false ||
  pointer.capabilities.v458SchemaPack !== "qualified-six-input-contracts" ||
  pointer.capabilities.v458ProductionStaging !== "blocked-0-of-6" ||
  pointer.capabilities.v458MeasuredDetectorAuthority !== "not-granted" ||
  pointer.promotion.promotionAllowed !== false ||
  pointer.promotion.fitsWriteAllowed !== false ||
  pointer.promotion.pngWriteAllowed !== false ||
  forbiddenProducts.length !== 0 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.runNextAuthorized !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84 ||
  evidence.dependency.v457EvidenceSha256 !== previousEvidence.evidenceSha256 ||
  evidence.dependency.v457PointerSha256 !== previousPointer.pointerSha256
) {
  throw new Error("v458-fail-closed-validation");
}
for (const entry of evidence.sourceManifest ?? []) {
  if (fileSha(entry.path) !== entry.sha256) {
    throw new Error(`v458-source-manifest-mismatch:${entry.path}`);
  }
}
if (
  /[A-Za-z]:\\|"(?:pid|processId|hostname|hostName|absolutePath)"\s*:/.test(
    JSON.stringify({ intake, evidence, pointer }),
  )
) {
  throw new Error("v458-transient-evidence-leak");
}
const componentSource = readFileSync(
  resolve(root, "app/components/KerrMeasuredDetectorDataAirlockV458.tsx"),
  "utf8",
);
if (
  !componentSource.includes("六把钥匙，一把都不能由模板冒充") ||
  /鍧|銆|鏁|绱|锛/.test(componentSource)
) {
  throw new Error("v458-utf8-airlock-validation");
}

console.log(
  JSON.stringify(
    {
      status: "passed-v458-low-memory-measured-detector-intake-fail-closed",
      artifactSha256: intake.artifactSha256,
      schemaPackSha256: intake.schemaPack.schemaPackSha256,
      evidenceSha256: evidence.evidenceSha256,
      pointerSha256: pointer.pointerSha256,
      requiredFiles: 6,
      productionReadyFiles: 0,
      syntheticControlAuthority: false,
      adversarialFixturesRejected: 11,
      measuredDetectorAuthority: "not-granted",
      promotionAllowed: false,
      fitsWriteAllowed: false,
      pngWriteAllowed: false,
      forbiddenImageProducts: forbiddenProducts.length,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
