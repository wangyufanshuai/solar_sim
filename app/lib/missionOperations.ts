import { AU_METERS } from "./physicalConstants";
import type {
  MissionInspectionSelection,
  MissionPlan,
  MissionRunProgressState,
  MissionTrajectoryInspectionSample,
  MissionWorkflowStage,
} from "./missionDesignerTypes";

export const MISSION_WORKFLOW_STAGES: MissionWorkflowStage[] = ["setup", "run", "inspect", "compare", "review"];

export const INITIAL_MISSION_RUN_PROGRESS: MissionRunProgressState = {
  status: "idle",
  message: "Ready",
  startedAt: null,
  completedAt: null,
};

export const EMPTY_MISSION_INSPECTION_SELECTION: MissionInspectionSelection = {
  sampleId: null,
  kind: "all",
  segmentId: null,
  query: "",
  simDay: null,
  positionAu: null,
};

export function canEnterMissionStage(
  stage: MissionWorkflowStage,
  context: { hasPlan: boolean; compareCount: number },
) {
  if (stage === "setup" || stage === "run") return true;
  if (stage === "inspect" || stage === "review") return context.hasPlan;
  if (stage === "compare") return context.compareCount >= 2;
  return false;
}

export function nextMissionStage(
  requested: MissionWorkflowStage,
  context: { hasPlan: boolean; compareCount: number },
): MissionWorkflowStage {
  if (canEnterMissionStage(requested, context)) return requested;
  if (context.hasPlan) return "inspect";
  return "run";
}

export function missionRunProgressLabel(progress: MissionRunProgressState) {
  if (progress.status === "idle") return "Ready";
  if (progress.status === "cancelled") return "Cancelled";
  if (progress.status === "loading-spice") return "SPICE";
  if (progress.status === "solving") return "Lambert";
  if (progress.status === "auditing") return "Cowell";
  if (progress.status === "done") return "Done";
  if (progress.status === "error") return "Error";
  return "Queued";
}

export function filterMissionInspectionSamples(
  samples: MissionTrajectoryInspectionSample[],
  selection: Pick<MissionInspectionSelection, "kind" | "segmentId" | "query">,
) {
  const query = selection.query.trim().toLowerCase();
  return samples.filter((sample) => {
    if (selection.kind !== "all" && sample.kind !== selection.kind) return false;
    if (selection.segmentId && sample.segmentId !== selection.segmentId) return false;
    if (!query) return true;
    const haystack = [
      sample.id,
      sample.kind,
      sample.segmentId,
      sample.label,
      sample.source,
      sample.nearestConstraintStatus,
      sample.simDay.toFixed(1),
      sample.epochTdbJd.toFixed(3),
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

export function missionInspectionPositionAu(
  plan: MissionPlan | null,
  sample: MissionTrajectoryInspectionSample | null,
): [number, number, number] | null {
  if (!sample) return null;
  if (sample.positionKm) {
    return sample.positionKm.map((value) => (value * 1000) / AU_METERS) as [number, number, number];
  }
  const segment = plan?.segments.find((item) => item.id === sample.segmentId);
  if (!segment?.trajectoryAu.length) return null;
  const u = Math.max(0, Math.min(1, (sample.simDay - segment.departureDay) / Math.max(1, segment.tofDays)));
  const index = Math.min(segment.trajectoryAu.length - 1, Math.max(0, Math.round(u * (segment.trajectoryAu.length - 1))));
  return segment.trajectoryAu[index] ?? null;
}

export function createMissionInspectionSelection(
  plan: MissionPlan | null,
  samples: MissionTrajectoryInspectionSample[],
  current: MissionInspectionSelection,
  sampleId: string | null,
): MissionInspectionSelection {
  const sample = samples.find((item) => item.id === sampleId) ?? samples[0] ?? null;
  return {
    ...current,
    sampleId: sample?.id ?? null,
    simDay: sample?.simDay ?? null,
    positionAu: missionInspectionPositionAu(plan, sample),
  };
}
