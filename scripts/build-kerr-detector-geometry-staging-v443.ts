import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { inspectKerrDetectorGeometryStagingAtPathV443 } from "../app/lib/kerrDetectorGeometryStagingV443";

const root = process.cwd();
const out = "dist/science/kerr-detector-geometry-staging-v443";
const transient = new Set(["generatedAt", "artifactSha256"]);
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value).filter(([key]) => !transient.has(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, canonicalize(entry)]));
const sha = (value: unknown): string => createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const fileSha = (path: string): string => createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const atomic = (path: string, value: unknown): void => { const target = resolve(root, path); mkdirSync(dirname(target), { recursive: true }); const part = `${target}.${process.pid}.part`; writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8"); renameSync(part, target); };
const v442Path = "dist/science/kerr-detector-projection-admission-v442/detector-projection-admission.json";
// Upstream artifact JSON is intentionally inspected as an open object; the v442 contract supplies the runtime boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const v442 = JSON.parse(readFileSync(resolve(root, v442Path), "utf8")) as Record<string, any>;
if (v442.version !== "v442-kerr-detector-projection-admission-v1" || v442.projection?.detectorProjectionAvailable !== false || v442.qualification?.measuredAuthorityGranted !== false || v442.denseCampaignStatus !== "incomplete-0-of-49") throw new Error("v443-v442-boundary");
const scan = inspectKerrDetectorGeometryStagingAtPathV443(resolve(root, "dist/staging/kerr-detector-projection-v443"));
const contractUnsigned = { version: "v443-kerr-detector-geometry-staging-contract-v1", expectedFiles: [{ id: "identity", fileName: "identity.json", format: "json", required: true }, { id: "plate-scale", fileName: "plate-scale.csv", format: "csv", required: true, minimumRepeatsPerAxis: 3, maximumCv: 0.005 }, { id: "distortion", fileName: "distortion.json", format: "json", required: true }, { id: "psf", fileName: "psf.json", format: "json", required: true }, { id: "pixel-response", fileName: "pixel-response.json", format: "json", required: true }, { id: "provenance", fileName: "provenance.json", format: "json", required: true, stagingOnly: true }], validation: { structuralOnly: true, independentV372ToV374Required: true, measuredAuthorityGranted: false, runtimeProjectionAllowed: false, scienceRasterAllowed: false, cinematicScienceWritebackAllowed: false, networkAttempted: false, automaticRetryApplied: false }, formalProductPointer: "v263", denseCampaignStatus: "incomplete-0-of-49" } as const;
const contract = { ...contractUnsigned, contractSha256: sha(contractUnsigned) };
const unsigned = { ...scan, version: "v443-kerr-detector-geometry-staging-inspect-v1", generatedAt: "2026-07-30T00:00:00Z", sourceV442ArtifactSha256: v442.artifactSha256, sourceV442FileSha256: fileSha(v442Path), contract, contractSha256: contract.contractSha256, authorityBoundary: { stagingInputInspectionOnly: true, measuredAuthorityGranted: false, runtimeProjectionAllowed: false, scienceRasterAllowed: false, cinematicScienceWritebackAllowed: false, independentValidationRequired: true, explicitAdmissionRequired: true }, nextStep: "provide-all-six-staging-files-then-run-v443-inspect-and-v372-v374-independent-gates" };
const artifact = { ...unsigned, artifactSha256: sha(unsigned) };
atomic(`${out}/staging-contract.json`, contract);
atomic(`${out}/staging-inspect.json`, artifact);
console.log(JSON.stringify({ status: artifact.status, artifactSha256: artifact.artifactSha256, contractSha256: contract.contractSha256, readyFileCount: artifact.readyFileCount, missingFileIds: artifact.missingFileIds, invalidFileIds: artifact.invalidFileIds, readyForIndependentValidation: artifact.readyForIndependentValidation, runtimeProjectionAllowed: false }, null, 2));
