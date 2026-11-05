import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  RELATIVITY_PROMOTION_EVIDENCE_V7_VERSION,
  createScientificPromotionDecisionFromRelativityReportV7,
  type AtlasScientificEvidenceManifestV7,
  type RelativityPromotionReportV7,
} from "../app/lib/relativityPromotionEvidenceV7";

const reportPath = path.resolve("dist/science/relativity-dop853-v7-report.json");
const legacyEvidencePath = path.resolve("dist/science/scientific-evidence-v5.json");

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function main(): Promise<void> {
  const reportBytes = await readFile(reportPath);
  const report = JSON.parse(reportBytes.toString("utf8")) as RelativityPromotionReportV7;
  if (report.version !== "v188-scipy-dop853-per-body-effect-isolation-v7") {
    throw new Error(`Unexpected V7 relativity report: ${report.version}`);
  }
  if (report.liveStateMutated !== false || report.workerStateMutated !== false) {
    throw new Error("V7 relativity evidence must not mutate live or worker state");
  }
  if (report.defaultKernel !== "legacy-eih-1pn") {
    throw new Error("V7 evidence attempted to change the default kernel");
  }

  const legacyEvidence = await readJson<{
    dataCatalog?: { passed?: boolean; independent?: boolean };
    observationModels?: { passed?: boolean; independent?: boolean };
    ephemeris?: { passed?: boolean; independent?: boolean };
    kerr?: { passed?: boolean; independent?: boolean };
    performance?: { passed?: boolean; independent?: boolean };
    regression?: { passed?: boolean; independent?: boolean };
  }>(legacyEvidencePath);
  const supportingGatesPassed = [
    legacyEvidence.dataCatalog,
    legacyEvidence.observationModels,
    legacyEvidence.ephemeris,
    legacyEvidence.kerr,
    legacyEvidence.performance,
    legacyEvidence.regression,
  ].every((gate) => gate?.passed === true && gate.independent === true);
  const decision = createScientificPromotionDecisionFromRelativityReportV7(
    report,
    supportingGatesPassed,
  );
  const bodyIds = new Set(
    report.perBodyComparison.flatMap((checkpoint) =>
      checkpoint.bodies.map((body) => body.bodyId),
    ),
  );
  const manifest: AtlasScientificEvidenceManifestV7 = {
    version: RELATIVITY_PROMOTION_EVIDENCE_V7_VERSION,
    artifact: path.relative(process.cwd(), reportPath).replaceAll("\\", "/"),
    sha256: sha256(reportBytes),
    fixtureSha256: report.fixtureSha256,
    coordinateFrame: report.coordinateFrame,
    timeScale: report.timeScale,
    checkpointCount: report.perBodyComparison.length,
    bodyCount: bodyIds.size,
    effectCount: report.effectIsolation.length,
    decision,
    boundary: "checksummed-offline-research-evidence-no-runtime-promotion",
  };
  const summary = {
    version: manifest.version,
    generatedAt: report.generatedAt,
    artifactSha256: manifest.sha256,
    fixtureSha256: manifest.fixtureSha256,
    checkpointCount: manifest.checkpointCount,
    bodyCount: manifest.bodyCount,
    effectCount: manifest.effectCount,
    promotionEvaluation: report.promotionEvaluation,
    decision: manifest.decision,
    capability: "summary-only-full-per-body-evidence-available-in-standalone-and-desktop",
    boundary: manifest.boundary,
  };

  await mkdir(path.resolve("dist/science"), { recursive: true });
  await mkdir(path.resolve("public/data"), { recursive: true });
  await writeFile(
    path.resolve("dist/science/scientific-evidence-v7.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await writeFile(
    path.resolve("public/data/scientific-evidence-v7-summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  console.log(
    `${manifest.version}: ${decision.status}; blockers=${decision.blockers.join(",") || "none"}`,
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
