import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const out = "dist/science/kerr-wcs-projection-availability-v441";
const oraclePath = `${out}/wcs-projection-oracle.json`;
const contractPath = `${out}/wcs-projection-contract.json`;
const transient = new Set(["generatedAt", "artifactSha256"]);

const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => !transient.has(key))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const fileSha = (path: string): string =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const atomic = (path: string, value: unknown): void => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const oracle = JSON.parse(readFileSync(resolve(root, oraclePath), "utf8")) as Record<
  string,
  unknown
>;
const contract = JSON.parse(readFileSync(resolve(root, contractPath), "utf8")) as Record<
  string,
  unknown
>;
const rows = oracle.rows as readonly Record<string, unknown>[] | undefined;
const counts = oracle.counts as Record<string, unknown> | undefined;
const maxima = oracle.maxima as Record<string, unknown> | undefined;
const qualification = oracle.qualification as Record<string, unknown> | undefined;

if (
  oracle.version !== "v441-kerr-wcs-projection-availability-python-oracle-v1" ||
  oracle.status !== "qualified-linear-wcs-coordinate-authority-detector-projection-blocked" ||
  rows?.length !== 4 ||
  counts?.joinedSourceCoordinateRowCount !== 24 ||
  counts.detectorProjectionCount !== 0 ||
  counts.psfModelCount !== 0 ||
  counts.rasterProductCount !== 0 ||
  maxima?.pythonAstropyPixelDifference !== 0 ||
  typeof maxima.sourceCoordinateJoinResidualPixel !== "number" ||
  maxima.sourceCoordinateJoinResidualPixel >= 1e-12 ||
  qualification?.wcsCoordinateAuthorityQualified !== true ||
  qualification.detectorProjectionBlocked !== true ||
  contract.version !== "v441-kerr-wcs-projection-availability-contract-v1"
) {
  throw new Error("v441-builder-input");
}

const unsigned = {
  version: "v441-kerr-wcs-projection-availability-artifact-v1",
  generatedAt: oracle.generatedAt,
  status: oracle.status,
  sourceFiles: {
    pythonOracleFileSha256: fileSha(oraclePath),
    contractFileSha256: fileSha(contractPath),
  },
  sourceV420ArtifactSha256: oracle.sourceV420ArtifactSha256,
  sourceV440ArtifactSha256: oracle.sourceV440ArtifactSha256,
  sourceV438ArtifactSha256: oracle.sourceV438ArtifactSha256,
  wcs: oracle.wcs,
  rows,
  maxima,
  contract,
  counts,
  qualification,
  deterministicReplay: true,
  networkAttempted: false,
  detectorProjectionAttempted: false,
  psfConvolutionAttempted: false,
  denseShardExecuted: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  boundary: "v441-linear-wcs-authority-only-no-measured-detector-projection-psf-or-raster",
};
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(`${out}/wcs-projection-availability.json`, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      wcsSources: rows.length,
      joinedCoordinates: counts.joinedSourceCoordinateRowCount,
      detectorProjection: 0,
      psfModels: 0,
    },
    null,
    2,
  ),
);
