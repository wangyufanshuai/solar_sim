import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseKerrScienceBandContrastArtifactV348 } from "../app/lib/kerrScienceBandContrastV348";
import { parseKerrScienceImagePixelProbeArtifactV346 } from "../app/lib/kerrScienceImagePixelProbeV346";
import { parseKerrScienceInstrumentResponseV332 } from "../app/lib/kerrScienceInstrumentResponseV332";
import { createKerrScienceBandObservationV350, parseKerrScienceBandObservationArtifactV350 } from "../app/lib/kerrScienceBandObservationV350";

const root = process.cwd();
const paths = { bandContrast: "dist/science/kerr-band-contrast-v348/diagnostic.json", probe: "dist/science/kerr-image-probe-v346/probe.json", instrument: "dist/science/kerr-science-instrument-response-v332/response-reference.json", output: "dist/science/kerr-band-observation-v350/observation.json", replay: "dist/science/kerr-band-observation-v350/replay.json" } as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const fileSha = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
function canonicalize(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalize); if (!value || typeof value !== "object") return value; return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)])); }
const sha = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
function atomic(path: string, value: unknown): void { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); }

const bandContrast = parseKerrScienceBandContrastArtifactV348(JSON.parse(bytes(paths.bandContrast).toString("utf8")));
const probe = parseKerrScienceImagePixelProbeArtifactV346(JSON.parse(bytes(paths.probe).toString("utf8")));
const instrumentDocument = JSON.parse(bytes(paths.instrument).toString("utf8")) as { artifactSha256: string; response: unknown };
const instrument = parseKerrScienceInstrumentResponseV332(instrumentDocument.response);
const source = { bandContrastPath: paths.bandContrast, bandContrastFileSha256: fileSha(paths.bandContrast), bandContrastArtifactSha256: bandContrast.artifactSha256, instrumentPath: paths.instrument, instrumentFileSha256: fileSha(paths.instrument), instrumentArtifactSha256: instrumentDocument.artifactSha256, fullShortAuthoritySha256: probe.source.fullShortAuthoritySha256 } as const;
const unsigned = createKerrScienceBandObservationV350(bandContrast, probe, instrument, source, "pending");
const artifact = parseKerrScienceBandObservationArtifactV350({ ...unsigned, artifactSha256: sha(unsigned) });
atomic(paths.output, artifact);
const replayUnsigned = { version: "v350-kerr-science-band-observation-replay-v1", generatedAt: new Date().toISOString(), status: "qualified-read-only-band-observation-provenance", observationArtifactSha256: artifact.artifactSha256, rowCount: artifact.rows.length, bandCount: artifact.definitions.length, deterministic: JSON.stringify(artifact.rows) === JSON.stringify(createKerrScienceBandObservationV350(bandContrast, probe, instrument, source, "pending").rows), exactSourceSha: true, noCalibratedCountClaim: artifact.availability.measuredDetectorCounts === "unavailable-synthetic-model-only", noSpectralFitClaim: artifact.availability.spectralTemperature === "unavailable-no-physical-fit", noWcsClaim: artifact.availability.celestialWcs === "unavailable-sparse-index-grid", noScienceMutation: true, scienceCinematicBoundary: artifact.scienceCinematicBoundary, denseCampaignStatus: artifact.denseCampaignStatus, browserQualification: artifact.browserQualification, boundary: "bounded-band-observation-provenance-no-network-no-calibration-no-cinematic-input" };
atomic(paths.replay, { ...replayUnsigned, artifactSha256: sha(replayUnsigned) });
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, rows: artifact.rows.length, bands: artifact.definitions.map((band) => band.id), deterministic: replayUnsigned.deterministic, measuredCounts: artifact.availability.measuredDetectorCounts, wcs: artifact.availability.celestialWcs, dense: artifact.denseCampaignStatus }, null, 2));
