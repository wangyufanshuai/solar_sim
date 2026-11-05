import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createKerrScienceObservationRasterAuditV342, createKerrScienceObservationRasterV342 } from "../app/lib/kerrScienceObservationRasterV342";
import { parseKerrScienceObservationProductV341 } from "../app/lib/kerrScienceObservationProductV341";

const root = process.cwd();
const sourcePath = "dist/science/kerr-observation-product-v341/observation-product.json";
const outputPath = "dist/science/kerr-observation-raster-v342/raster.json";
const bytes = readFileSync(resolve(root, sourcePath));
const sourceArtifact = JSON.parse(bytes.toString("utf8")) as { product?: unknown; artifactSha256?: unknown };
const product = parseKerrScienceObservationProductV341(sourceArtifact.product);
const raster = createKerrScienceObservationRasterV342(product, String(sourceArtifact.artifactSha256));
const audit = createKerrScienceObservationRasterAuditV342(raster);
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
}
const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const unsigned = { version: "v342-kerr-science-observation-raster-artifact-v1", generatedAt: new Date().toISOString(), status: "qualified-raster-science-invariant-cinematic-seeded", source: { path: sourcePath, fileSha256: sha256(bytes), canonicalSha256: sourceArtifact.artifactSha256 }, raster, audit, boundary: "v341-sparse-product-to-v342-four-by-three-raster-no-dense-image" };
const artifact = { ...unsigned, artifactSha256: sha256(JSON.stringify(canonicalize(unsigned))) };
const target = resolve(root, outputPath); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`); renameSync(temporary, target);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, sourceProductArtifactSha256: sourceArtifact.artifactSha256, cells: raster.counts.cellCount, scienceDigest: raster.scienceDigest, cinematicDigests: raster.cinematicDigests, dense: raster.authority.denseCampaignStatus }, null, 2));
