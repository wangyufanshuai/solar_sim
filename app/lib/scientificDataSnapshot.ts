export const SCIENTIFIC_DATA_SNAPSHOT_VERSION = "v147-scientific-data-snapshot-registry" as const;

export type ScienceEnvironmentPackage = {
  name: string;
  version: string;
};

export type ScienceEnvironmentManifest = {
  version: "v147-project-local-science-environment";
  generatedAt: string;
  root: string;
  python: { executable: string; version: string; platform: string };
  requirementsSha256: string;
  packages: readonly ScienceEnvironmentPackage[];
  wheels: readonly { name: string; bytes: number; sha256: string }[];
  policy: "project-local-e-drive-no-global-python-mutation-serial-heavy-processes";
};

export type ScientificDataSnapshotEntry = {
  id: string;
  source: string;
  sourceUrl: string;
  query: string | null;
  retrievedAt: string;
  schemaVersion: number;
  rowCount: number;
  fields: readonly string[];
  rawSha256: string;
  outputSha256: string;
  license: string;
  citation: string;
  transform: string;
};

export type ScientificDataSnapshotManifest = {
  version: typeof SCIENTIFIC_DATA_SNAPSHOT_VERSION;
  generatedAt: string;
  entries: readonly ScientificDataSnapshotEntry[];
  temporaryDataLimitBytes: 2_147_483_648;
  runtimePolicy: "build-time-network-runtime-offline";
};

export function validateScientificDataSnapshotManifest(
  manifest: ScientificDataSnapshotManifest,
): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const entry of manifest.entries) {
    if (ids.has(entry.id)) errors.push(`duplicate-entry:${entry.id}`);
    ids.add(entry.id);
    if (!entry.source || !entry.sourceUrl || !entry.citation) errors.push(`missing-provenance:${entry.id}`);
    if (!(entry.rowCount >= 0) || !Number.isInteger(entry.rowCount)) errors.push(`invalid-row-count:${entry.id}`);
    if (entry.fields.length === 0) errors.push(`missing-fields:${entry.id}`);
    if (!/^[a-f0-9]{64}$/.test(entry.rawSha256)) errors.push(`invalid-raw-checksum:${entry.id}`);
    if (!/^[a-f0-9]{64}$/.test(entry.outputSha256)) errors.push(`invalid-output-checksum:${entry.id}`);
    if (!Number.isFinite(Date.parse(entry.retrievedAt))) errors.push(`invalid-retrieved-at:${entry.id}`);
  }
  return errors;
}

