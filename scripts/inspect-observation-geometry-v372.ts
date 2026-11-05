import { createHash } from "node:crypto";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseObservationGeometryValidationInspectV372 } from "../app/lib/observationGeometryValidationInspectV372";

const root = process.cwd();
const output = "dist/science/observation-geometry-v372/inspect.json";
const inputs = [
  {
    id: "v371-compiled-artifact",
    path: "dist/science/observation-geometry-v371/compiled.json",
  },
  {
    id: "v371-geometry-candidate",
    path: "dist/science/observation-geometry-v371/geometry.candidate.json",
  },
  { id: "identity-json", path: "dist/staging/observation-geometry-v371/identity.json" },
  {
    id: "collecting-area-csv",
    path: "dist/staging/observation-geometry-v371/collecting-area.csv",
  },
  {
    id: "plate-scale-csv",
    path: "dist/staging/observation-geometry-v371/plate-scale.csv",
  },
  {
    id: "provenance-json",
    path: "dist/staging/observation-geometry-v371/provenance.json",
  },
] as const;
const present = inputs
  .filter((entry) => existsSync(resolve(root, entry.path)))
  .map((entry) => entry.id);
const missing = inputs
  .filter((entry) => !present.includes(entry.id))
  .map((entry) => entry.id);
const canonicalize = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(canonicalize)
    : !value || typeof value !== "object"
      ? value
      : Object.fromEntries(
          Object.entries(value as Record<string, unknown>)
            .filter(([key]) => !["generatedAt", "artifactSha256"].includes(key))
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalize(entry)]),
        );
const sha = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
const unsigned = {
  version: "v372-independent-observation-geometry-validation-inspect-v1" as const,
  generatedAt: new Date().toISOString(),
  status: (missing.length > 0
    ? "blocked-validation-inputs-unavailable"
    : "ready-for-explicit-independent-validation") as
    | "blocked-validation-inputs-unavailable"
    | "ready-for-explicit-independent-validation",
  expectedInputs: inputs.map((entry) => entry.id) as [
    "v371-compiled-artifact",
    "v371-geometry-candidate",
    "identity-json",
    "collecting-area-csv",
    "plate-scale-csv",
    "provenance-json",
  ],
  presentInputCount: present.length,
  missingInputs: missing,
  invalidReason: null,
  validatorImplemented: true as const,
  validationCommand:
    "npm run atlas -- relativity observation-geometry-v372-validate" as const,
  validationExecuted: false as const,
  measuredValidationQualified: false as const,
  runtimeGeometryPublished: false as const,
  measuredAuthorityGranted: false as const,
  attemptConsumed: false as const,
  networkAttempted: false as const,
  formalProductPointer: "v263" as const,
  denseCampaignStatus: "incomplete-0-of-49" as const,
  browserQualification: "not-run" as const,
};
const artifact = parseObservationGeometryValidationInspectV372({
  ...unsigned,
  artifactSha256: sha(unsigned),
});
const target = resolve(root, output);
mkdirSync(dirname(target), { recursive: true });
const temporary = `${target}.${process.pid}.part`;
writeFileSync(temporary, `${JSON.stringify(artifact, null, 2)}\n`);
renameSync(temporary, target);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      present: artifact.presentInputCount,
      missing: artifact.missingInputs,
      validator: artifact.validatorImplemented,
      validationExecuted: artifact.validationExecuted,
      measuredQualified: artifact.measuredValidationQualified,
      authorityGranted: artifact.measuredAuthorityGranted,
      attemptConsumed: artifact.attemptConsumed,
    },
    null,
    2,
  ),
);
