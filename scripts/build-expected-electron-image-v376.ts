import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createExpectedElectronScienceImageV376,
  type ExpectedElectronScienceImageCellV376,
} from "../app/lib/expectedElectronScienceImageV376";
import type { MeasuredExpectationAuthorityEnvelopeV375 } from "../app/lib/measuredExpectationAuthorityV375";

const root = process.cwd();
const sourcePath = "dist/science/measured-expectation-v375/envelope.json";
const jsonPath = "dist/science/expected-electron-image-v376/image.json";
const csvPath = "dist/science/expected-electron-image-v376/image.csv";
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(
              ([key]) =>
                !["generatedAt", "artifactSha256", "pointerSha256"].includes(key),
            )
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const canonicalSha = (value: unknown) => sha(JSON.stringify(canonicalize(value)));
const atomic = (path: string, value: string) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.part`;
  writeFileSync(temporary, value);
  renameSync(temporary, target);
};
const csv = (cells: readonly ExpectedElectronScienceImageCellV376[]) => {
  const header = [
    "row",
    "column",
    "rayIndex",
    "bandId",
    "sourceElectronExpectation",
    "darkElectronExpectation",
    "backgroundElectronExpectation",
    "readNoiseVarianceElectronSquared",
    "totalElectronExpectation",
    "expectedAdu",
    "varianceElectronSquared",
    "standardDeviationElectron",
    "componentSumRelativeDifference",
    "varianceReconstructionRelativeDifference",
  ];
  return `${[
    header.join(","),
    ...cells.map((cell) => header.map((key) => String(cell[key as keyof typeof cell])).join(",")),
  ].join("\n")}\n`;
};

if (existsSync(resolve(root, jsonPath)) || existsSync(resolve(root, csvPath))) {
  throw new Error("v376-refuse-overwrite-existing-image");
}
const sourceBytes = readFileSync(resolve(root, sourcePath));
const envelopeArtifact = JSON.parse(sourceBytes.toString("utf8")) as
  MeasuredExpectationAuthorityEnvelopeV375 & { artifactSha256?: string };
if (
  !envelopeArtifact.artifactSha256 ||
  canonicalSha(envelopeArtifact) !== envelopeArtifact.artifactSha256
) {
  throw new Error("v376-envelope-artifact-sha");
}
const image = createExpectedElectronScienceImageV376(
  envelopeArtifact,
  envelopeArtifact.artifactSha256,
);
if (!image.imageAvailable || !image.product) {
  throw new Error("v376-image-unavailable");
}
const csvSource = csv(image.product.cells);
const unsigned = {
  version: "v376-expected-electron-science-image-artifact-v1",
  generatedAt: new Date().toISOString(),
  status: image.status,
  source: {
    path: sourcePath,
    fileSha256: sha(sourceBytes),
    canonicalSha256: envelopeArtifact.artifactSha256,
  },
  csv: {
    path: csvPath,
    fileSha256: sha(csvSource),
    rowCount: image.product.counts.cellCount,
  },
  image,
  attemptConsumed: true,
  networkAttempted: false,
  automaticPromotionApplied: false,
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
atomic(csvPath, csvSource);
atomic(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      csvSha256: artifact.csv.fileSha256,
      rows: image.product.counts.rowCount,
      columns: image.product.counts.columnCount,
      cells: image.product.counts.cellCount,
      maximumComponentDifference:
        image.product.maximumComponentSumRelativeDifference,
      maximumVarianceDifference:
        image.product.maximumVarianceReconstructionRelativeDifference,
      observedCounts: image.observedCounts,
    },
    null,
    2,
  ),
);
