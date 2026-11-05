import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseDetectorCalibrationManifestV361 } from "./detectorCalibrationAdmissionV361";
import { parseDetectorCalibrationAuthorityEnvelopeV367, parseDetectorCalibrationAuthorityPointerV367 } from "./detectorResponseAuthorityGateV368";
import { parseKerrSciencePhotonBandViewV328 } from "./kerrSciencePhotonBandsV328";
import { createMeasuredPhotonExpectationV369, parseMeasuredObservationGeometryV369, parseMeasuredPhotonExpectationV369, type MeasuredPhotonExpectationV369 } from "./measuredPhotonExpectationV369";

const PATHS = {
  photon: "dist/science/kerr-science-photon-bands-v328/photon-radiance.json",
  admission: "dist/science/detector-calibration-v367/admission.json",
  authorityPointer: "dist/release/orbit-atlas-detector-calibration-authority-v367.json",
  manifest: "dist/staging/detector-calibration-v361/manifest.json",
  geometry: "dist/staging/detector-calibration-v369/observation-geometry.json",
} as const;
let cache: { fingerprint: string; promise: Promise<MeasuredPhotonExpectationV369> } | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha = (value: unknown) => sha(JSON.stringify(canonicalize(value)));
async function metadata(path: string, maximumBytes: number, required = false) {
  try { const value = await stat(path); if (!value.isFile() || value.size <= 0 || value.size > maximumBytes) throw new Error("v369-artifact-size"); return value; }
  catch (error) { if (!required && (error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}

export async function loadMeasuredPhotonExpectationV369(root = process.cwd()): Promise<MeasuredPhotonExpectationV369> {
  const absolute = Object.fromEntries(Object.entries(PATHS).map(([key, path]) => [key, resolve(root, path)])) as Record<keyof typeof PATHS, string>;
  const [photonMetadata, admissionMetadata, pointerMetadata, manifestMetadata, geometryMetadata] = await Promise.all([
    metadata(absolute.photon, 512 * 1024, true), metadata(absolute.admission, 512 * 1024), metadata(absolute.authorityPointer, 64 * 1024), metadata(absolute.manifest, 1024 * 1024), metadata(absolute.geometry, 64 * 1024),
  ]);
  const fingerprint = [photonMetadata, admissionMetadata, pointerMetadata, manifestMetadata, geometryMetadata].map((entry) => entry ? `${entry.size}:${entry.mtimeMs}` : "missing").join("|");
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = (async () => {
    const photonBytes = await readFile(absolute.photon); const photonDocument = JSON.parse(photonBytes.toString("utf8")) as { view?: unknown; artifactSha256?: string };
    if (!photonDocument.view || canonicalSha(photonDocument) !== photonDocument.artifactSha256) throw new Error("v369-photon-artifact-sha");
    const photonView = parseKerrSciencePhotonBandViewV328(photonDocument.view);
    if (!admissionMetadata || !pointerMetadata || !manifestMetadata || !geometryMetadata) return parseMeasuredPhotonExpectationV369(createMeasuredPhotonExpectationV369({ photonView, admission: null, authorityPointer: null, manifest: null, verifiedManifestFileSha256: null, verifiedManifestCanonicalSha256: null, observationGeometry: null }));
    const [admissionBytes, pointerBytes, manifestBytes, geometryBytes] = await Promise.all([readFile(absolute.admission), readFile(absolute.authorityPointer), readFile(absolute.manifest), readFile(absolute.geometry)]);
    const admission = parseDetectorCalibrationAuthorityEnvelopeV367(JSON.parse(admissionBytes.toString("utf8"))); if (canonicalSha(admission) !== admission.artifactSha256) throw new Error("v369-admission-sha");
    const authorityPointer = parseDetectorCalibrationAuthorityPointerV367(JSON.parse(pointerBytes.toString("utf8"))); if (canonicalSha(authorityPointer) !== authorityPointer.pointerSha256) throw new Error("v369-authority-pointer-sha");
    const manifest = parseDetectorCalibrationManifestV361(JSON.parse(manifestBytes.toString("utf8")));
    const geometry = parseMeasuredObservationGeometryV369(JSON.parse(geometryBytes.toString("utf8"))); if (canonicalSha(geometry) !== geometry.provenance.artifactSha256) throw new Error("v369-geometry-sha");
    return parseMeasuredPhotonExpectationV369(createMeasuredPhotonExpectationV369({ photonView, admission, authorityPointer, manifest, verifiedManifestFileSha256: sha(manifestBytes), verifiedManifestCanonicalSha256: canonicalSha(manifest), observationGeometry: geometry }));
  })();
  cache = { fingerprint, promise };
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetMeasuredPhotonExpectationServerV369CacheForTests(): void { cache = null; }
