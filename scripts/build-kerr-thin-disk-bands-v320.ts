import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319,
  createKerrThinDiskBandImagingViewV320,
} from "../app/lib/kerrThinDiskBandImagingV320";
import { parseKerrThinDiskSpectralViewV319 } from "../app/lib/kerrThinDiskSpectralV319";

const root = process.cwd();
const input = "dist/science/kerr-thin-disk-v319/sparse-spectrum.json";
const output = "dist/science/kerr-thin-disk-v320/fixed-band-imaging.json";
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize)
  : !value || typeof value !== "object" ? value
    : Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "generatedAt" && key !== "artifactSha256")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const inputBytes = readFileSync(resolve(root, input));
const inputFileSha256 = createHash("sha256").update(inputBytes).digest("hex");
const source = JSON.parse(inputBytes.toString("utf8")) as Record<string, unknown>;
if (source.version !== "v319-kerr-thin-disk-spectral-artifact-v1"
  || source.artifactSha256 !== KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319
  || canonicalSha(source) !== KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319) {
  throw new Error("v320-v319-spectrum-authority-lock-mismatch");
}
const view = createKerrThinDiskBandImagingViewV320(parseKerrThinDiskSpectralViewV319(source.view));
const unsigned = {
  version: "v320-kerr-thin-disk-fixed-band-artifact-v1",
  generatedAt: new Date().toISOString(),
  source: {
    path: input,
    fileSha256: inputFileSha256,
    canonicalSha256: KERR_THIN_DISK_SOURCE_ARTIFACT_SHA256_V319,
  },
  view,
  boundary: "immutable-fixed-band-sparse-science-product-no-dense-or-product-promotion",
};
const artifact = { ...unsigned, artifactSha256: canonicalSha(unsigned) };
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(JSON.stringify({
  status: view.status,
  artifactSha256: artifact.artifactSha256,
  applicableDiskRayCount: view.counts.applicableDiskRayCount,
  saturatedChannelCount: view.counts.saturatedChannelCount,
  maxima: view.maxima,
  output,
}, null, 2));
