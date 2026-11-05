import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseDetectorCalibrationInspectArtifactV361 } from "../app/lib/detectorCalibrationAdmissionV361";
import { parseKerrDetectorBreakEvenArtifactV360 } from "../app/lib/kerrDetectorBreakEvenV360";
import { createKerrDetectorCalibrationPlanV363, parseKerrDetectorCalibrationPlanV363 } from "../app/lib/kerrDetectorCalibrationPlanV363";

const root = process.cwd();
const paths = {
  breakEven: "dist/science/kerr-detector-break-even-v360/audit.json",
  inspect: "dist/science/detector-calibration-v361/inspect.json",
  output: "dist/science/kerr-detector-calibration-plan-v363/plan.json",
  replay: "dist/science/kerr-detector-calibration-plan-v363/replay.json",
} as const;
const bytes = (path: string) => readFileSync(resolve(root, path));
const fileSha256 = (path: string) => createHash("sha256").update(bytes(path)).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));
const canonicalSha256 = (value: unknown) => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const atomicWrite = (path: string, value: unknown) => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const temporary = `${target}.${process.pid}.part`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`); renameSync(temporary, target); };

const breakEven = parseKerrDetectorBreakEvenArtifactV360(JSON.parse(bytes(paths.breakEven).toString("utf8")));
const inspect = parseDetectorCalibrationInspectArtifactV361(JSON.parse(bytes(paths.inspect).toString("utf8")));
const source = {
  breakEvenPath: paths.breakEven,
  breakEvenFileSha256: fileSha256(paths.breakEven),
  breakEvenArtifactSha256: breakEven.artifactSha256,
  calibrationInspectPath: paths.inspect,
  calibrationInspectFileSha256: fileSha256(paths.inspect),
  calibrationInspectArtifactSha256: inspect.artifactSha256,
} as const;
const unsigned = createKerrDetectorCalibrationPlanV363(breakEven, inspect, source, "pending");
const artifact = parseKerrDetectorCalibrationPlanV363({ ...unsigned, artifactSha256: canonicalSha256(unsigned) });
atomicWrite(paths.output, artifact);
const repeated = createKerrDetectorCalibrationPlanV363(breakEven, inspect, source, "pending");
const replayUnsigned = {
  version: "v363-kerr-detector-calibration-acquisition-plan-replay-v1",
  generatedAt: new Date().toISOString(),
  status: artifact.status,
  planArtifactSha256: artifact.artifactSha256,
  deterministic: JSON.stringify(canonicalize(artifact)) === JSON.stringify(canonicalize({ ...repeated, artifactSha256: artifact.artifactSha256 })),
  bandPriority: artifact.bandPressure.slice().sort((left, right) => left.priorityRank - right.priorityRank).map((entry) => entry.bandId),
  acquisitionTaskCount: artifact.counts.acquisitionTaskCount,
  missingRequirementCount: artifact.counts.missingRequirementCount,
  identifiabilityRank: artifact.identifiability.rank,
  measuredPerformanceClaimed: artifact.measuredPerformanceClaimed,
  attemptConsumed: artifact.attemptConsumed,
  networkAttempted: artifact.networkAttempted,
  scienceCinematicBoundary: artifact.scienceCinematicBoundary,
  denseCampaignStatus: artifact.denseCampaignStatus,
  browserQualification: artifact.browserQualification,
};
const replay = { ...replayUnsigned, artifactSha256: canonicalSha256(replayUnsigned) };
atomicWrite(paths.replay, replay);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, tasks: artifact.counts.acquisitionTaskCount, requirements: artifact.counts.missingRequirementCount, rank: artifact.identifiability.rank, bandPriority: replay.bandPriority, measuredAuthority: artifact.measuredCalibrationAuthority, taskExecution: artifact.taskExecutionStatus, dense: artifact.denseCampaignStatus }, null, 2));
