import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { loadAtlasRelativityEvidenceSnapshotV285R1 } from "./relativityEvidenceServerV285R1";
import type { AtlasRelativityEvidenceSnapshotV324, RelativityWorkbenchEvidenceV324 } from "./relativityWorkbenchEvidenceV324";

const V324_EVIDENCE_RELATIVE = "dist/science/orbit-atlas-shadow-v324-evidence.json";
const V324_INPUT_MAX_BYTES = 512 * 1024;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !["generatedAt", "artifactSha256", "pointerSha256", "pid", "host", "absolutePath", "peakRssGiB", "freeMemoryGiB", "freeDiskGiB", "elapsedSeconds"].includes(key))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => [key, canonicalize(entry)]));
}

function canonicalSha(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isSha(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function unavailableV324(): RelativityWorkbenchEvidenceV324 {
  return {
    status: "unavailable",
    profileTokenSources: [],
    scienceTokenEquivalent: false,
    scienceTokenMismatchCount: 0,
    cinematicTokensDistinct: false,
    scienceDigestStable: false,
    browserQualificationRun: false,
    artifactSha256: null,
  };
}

export async function loadAtlasRelativityEvidenceSnapshotV324(root = process.cwd()): Promise<AtlasRelativityEvidenceSnapshotV324> {
  const base = await loadAtlasRelativityEvidenceSnapshotV285R1(root);
  try {
    const path = resolve(root, V324_EVIDENCE_RELATIVE);
    const metadata = await stat(path);
    if (!metadata.isFile() || metadata.size <= 0 || metadata.size > V324_INPUT_MAX_BYTES) throw new Error("v324-evidence-input-boundary");
    const bytes = await readFile(path);
    if (bytes.byteLength !== metadata.size) throw new Error("v324-evidence-changed-during-read");
    const document = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
    const expected = document.evidenceSha256;
    if (!isSha(expected)) throw new Error("v324-evidence-sha-missing");
    const unsigned = { ...document };
    delete unsigned.evidenceSha256;
    if (canonicalSha(unsigned) !== expected) throw new Error("v324-evidence-sha-mismatch");
    const runtime = record(document.runtime);
    const profileTokenSources = Array.isArray(runtime.profileTokenSources)
      ? runtime.profileTokenSources.filter((entry): entry is "v5" | "v6" => entry === "v5" || entry === "v6").slice(0, 2)
      : [];
    const status: RelativityWorkbenchEvidenceV324["status"] = document.status === "science-profile-equivalent-browser-pending-dense-incomplete-0-of-49"
      ? "science-profile-equivalent-browser-pending"
      : document.status === "science-profile-drift" ? "science-profile-drift" : "unavailable";
    return {
      ...base,
      version: "v324-relativity-evidence-snapshot",
      current: {
        ...base.current,
        v324: {
          status,
          profileTokenSources,
          scienceTokenEquivalent: runtime.scienceTokenEquivalent === true,
          scienceTokenMismatchCount: Number.isSafeInteger(runtime.scienceTokenMismatchCount) ? Math.min(4, Math.max(0, Number(runtime.scienceTokenMismatchCount))) : 0,
          cinematicTokensDistinct: runtime.cinematicTokensDistinct === true,
          scienceDigestStable: runtime.scienceDigestStable === true,
          browserQualificationRun: false,
          artifactSha256: expected,
        },
      },
    };
  } catch {
    return {
      ...base,
      version: "v324-relativity-evidence-snapshot",
      status: "corrupt",
      current: { ...base.current, v324: unavailableV324() },
    };
  }
}
