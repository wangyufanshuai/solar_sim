import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseKerrScienceBandObservationArtifactV350, type KerrScienceBandObservationArtifactV350 } from "./kerrScienceBandObservationV350";
import { parseKerrScienceBandContrastArtifactV348 } from "./kerrScienceBandContrastV348";

const PATH = "dist/science/kerr-band-observation-v350/observation.json"; const BAND_CONTRAST = "dist/science/kerr-band-contrast-v348/diagnostic.json"; const INSTRUMENT = "dist/science/kerr-science-instrument-response-v332/response-reference.json"; const LIMIT = 96 * 1024;
let cache: { fingerprint: string; promise: Promise<KerrScienceBandObservationArtifactV350> } | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); }
const canonicalSha = (value: unknown) => sha(JSON.stringify(canonicalize(value)));

export async function loadKerrScienceBandObservationV350(root = process.cwd()): Promise<KerrScienceBandObservationArtifactV350> {
  const path = resolve(root, PATH); const metadata = await stat(path); if (!metadata.isFile() || metadata.size <= 0 || metadata.size > LIMIT) throw new Error("v350-observation-size");
  const sourceBytes = await readFile(path); if (sourceBytes.byteLength !== metadata.size) throw new Error("v350-observation-race"); const fingerprint = `${metadata.size}:${metadata.mtimeMs}:${sha(sourceBytes)}`; if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.all([readFile(path), readFile(resolve(root, BAND_CONTRAST)), readFile(resolve(root, INSTRUMENT))]).then(([bytes, bandBytes, instrumentBytes]) => {
    const artifact = parseKerrScienceBandObservationArtifactV350(JSON.parse(bytes.toString("utf8"))); const bandContrast = parseKerrScienceBandContrastArtifactV348(JSON.parse(bandBytes.toString("utf8"))); const instrumentDocument = JSON.parse(instrumentBytes.toString("utf8")) as { artifactSha256?: string };
    if (canonicalSha(artifact) !== artifact.artifactSha256 || artifact.source.bandContrastFileSha256 !== sha(bandBytes) || artifact.source.bandContrastArtifactSha256 !== bandContrast.artifactSha256 || artifact.source.instrumentFileSha256 !== sha(instrumentBytes) || artifact.source.instrumentArtifactSha256 !== instrumentDocument.artifactSha256 || artifact.source.fullShortAuthoritySha256 !== bandContrast.source.fullShortAuthoritySha256) throw new Error("v350-observation-source-sha");
    return artifact;
  }); cache = { fingerprint, promise }; try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}
export function resetKerrScienceBandObservationServerV350CacheForTests(): void { cache = null; }
