import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312 } from "../app/lib/kerrAuthorityV312";
import { KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313 } from "../app/lib/kerrAuthorityV313";
import {
  KERR_SCATTERING_ATMOSPHERE_ARTIFACT_VERSION_V407,
  KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406,
  createKerrScatteringAtmosphereViewV407,
  parseKerrScatteringAtmosphereArtifactV407,
} from "../app/lib/kerrScatteringAtmosphereV407";
import { parseKerrStokesTransferArtifactV406 } from "../app/lib/kerrStokesTransferV406";

const root = process.cwd();
const inputs = Object.freeze({
  geometry: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  polarization: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  v406Stokes: "dist/science/kerr-stokes-transfer-v406/short-gate.json",
});
const output = "dist/science/kerr-scattering-atmosphere-v407/short-gate.json";
const bytes = (path: string) => readFileSync(resolve(root, path));
const read = (path: string) => JSON.parse(bytes(path).toString("utf8")) as unknown;
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value)
  ? value.map(canonicalize)
  : !value || typeof value !== "object"
    ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const sourceFiles = Object.freeze({ geometry: fileSha(inputs.geometry), polarization: fileSha(inputs.polarization) });
if (sourceFiles.geometry !== KERR_CORRECTED_AUTHORITY_FILE_SHA256_V312 || sourceFiles.polarization !== KERR_POLARIZATION_AUTHORITY_FILE_SHA256_V313) throw new Error("v407-source-authority-file-lock");
const geometry = read(inputs.geometry);
const polarization = read(inputs.polarization);
const v406Stokes = parseKerrStokesTransferArtifactV406(read(inputs.v406Stokes));
if (canonicalSha(v406Stokes) !== v406Stokes.artifactSha256 || v406Stokes.artifactSha256 !== KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406) throw new Error("v407-v406-canonical-lock");
const first = createKerrScatteringAtmosphereViewV407(geometry, polarization, v406Stokes);
const second = createKerrScatteringAtmosphereViewV407(geometry, polarization, v406Stokes);
if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("v407-scattering-determinism");
const unsigned = Object.freeze({
  version: KERR_SCATTERING_ATMOSPHERE_ARTIFACT_VERSION_V407,
  generatedAt: new Date().toISOString(),
  sourceFiles,
  sourceArtifacts: Object.freeze({ v406StokesCanonical: KERR_STOKES_TRANSFER_ARTIFACT_SHA256_V406 }),
  view: first,
  deterministicReplay: true as const,
  networkAttemptedByBuild: false as const,
  denseShardExecuted: false as const,
  boundary: "immutable-derived-sparse-scattering-atmosphere-no-dense-or-product-promotion" as const,
});
const artifact = parseKerrScatteringAtmosphereArtifactV407({ ...unsigned, artifactSha256: canonicalSha(unsigned) });
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
renameSync(temporary, target);
console.log(JSON.stringify({ status: artifact.view.status, artifactSha256: artifact.artifactSha256, angleRecords: artifact.view.angleAudit.records.length, muRange: [artifact.view.angleAudit.minimumMu, artifact.view.angleAudit.maximumMu], polarizationFractionRange: [artifact.view.angleAudit.minimumFraction, artifact.view.angleAudit.maximumFraction], samples: artifact.view.counts.stokesSampleCount, comparisons: artifact.view.counts.pathComparisonCount, maxima: artifact.view.maxima, denseAggregate: artifact.view.authority.denseAggregateSha256, output }, null, 2));
