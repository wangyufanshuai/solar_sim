import {
  createRelativityWorkbenchEvidenceModelV285,
  type AtlasRelativityEvidenceSnapshotV285,
  type RelativityEvidenceLoadStatusV285,
  type RelativityWorkbenchEvidenceModelV285,
} from "./relativityWorkbenchEvidenceV285";

export type RelativityWorkbenchEvidenceV324 = Readonly<{
  status: "science-profile-equivalent-browser-pending" | "science-profile-drift" | "unavailable";
  profileTokenSources: readonly ("v5" | "v6")[];
  scienceTokenEquivalent: boolean;
  scienceTokenMismatchCount: number;
  cinematicTokensDistinct: boolean;
  scienceDigestStable: boolean;
  browserQualificationRun: false;
  artifactSha256: string | null;
}>;

export type AtlasRelativityEvidenceSnapshotV324 = Omit<AtlasRelativityEvidenceSnapshotV285, "version" | "current"> & Readonly<{
  version: "v324-relativity-evidence-snapshot";
  current: AtlasRelativityEvidenceSnapshotV285["current"] & Readonly<{ v324: RelativityWorkbenchEvidenceV324 }>;
}>;

type RelativityWorkbenchCurrentRowV324 = RelativityWorkbenchEvidenceModelV285["currentRows"][number] | Readonly<{
  id: "v324";
  status: RelativityWorkbenchEvidenceV324["status"];
  label: string;
  metric: string;
  artifactSha256: string | null;
}>;

export type RelativityWorkbenchEvidenceModelV324 = Omit<RelativityWorkbenchEvidenceModelV285, "version" | "currentRows"> & Readonly<{
  version: "v324-relativity-workbench-evidence-model";
  currentRows: readonly RelativityWorkbenchCurrentRowV324[];
}>;

export function createRelativityWorkbenchEvidenceModelV324(
  snapshot: AtlasRelativityEvidenceSnapshotV324,
  loadStatus: RelativityEvidenceLoadStatusV285 = "ready",
): RelativityWorkbenchEvidenceModelV324 {
  const { v324, ...legacyCurrent } = snapshot.current;
  const legacySnapshot: AtlasRelativityEvidenceSnapshotV285 = {
    ...snapshot,
    version: "v285r1-relativity-evidence-snapshot",
    current: legacyCurrent,
  };
  const legacy = createRelativityWorkbenchEvidenceModelV285(legacySnapshot, loadStatus);
  return {
    ...legacy,
    version: "v324-relativity-workbench-evidence-model",
    currentRows: [
      ...legacy.currentRows,
      {
        id: "v324",
        status: v324.status,
        label: "V5/V6 Science profile equivalence",
        metric: `${v324.profileTokenSources.join("+") || "no profile"} / science ${v324.scienceTokenEquivalent ? "equivalent" : "drift"} (${v324.scienceTokenMismatchCount} mismatches) / cinematic ${v324.cinematicTokensDistinct ? "distinct" : "not distinct"} / digest ${v324.scienceDigestStable ? "stable" : "pending"} / browser not run`,
        artifactSha256: v324.artifactSha256,
      },
    ],
  };
}

export type RelativityEvidenceResponseV324 = Readonly<{
  version: "v324-relativity-evidence-response";
  available: boolean;
  reason: "ready" | "lite-boundary" | "evidence-unavailable" | "evidence-corrupt";
  snapshot: AtlasRelativityEvidenceSnapshotV324 | null;
}>;
