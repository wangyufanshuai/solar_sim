import type { SceneLabDocument } from "./atlasReleaseProgram";

export const SCENE_LAB_VERSION = "v138-controlled-scene-lab" as const;

export type SceneLabParameterDefinition = {
  id: string;
  label: string;
  minimum: number;
  maximum: number;
  step: number;
  defaultValue: number;
  unit: string;
};

export type SceneLabComparison = {
  baseline: SceneLabDocument;
  candidate: SceneLabDocument;
  changedParameterIds: readonly string[];
};

export function createSceneLabDocument(input: {
  id: string;
  title: string;
  sourceSceneId: string;
  parameters: Readonly<Record<string, number | boolean | string>>;
  createdAt?: string;
}): SceneLabDocument {
  return { schemaVersion: 1, ...input, createdAt: input.createdAt ?? new Date().toISOString(), boundary: "isolated-copy-never-writes-canonical-ephemeris" };
}

export function updateSceneLabParameter(document: SceneLabDocument, definition: SceneLabParameterDefinition, value: number): SceneLabDocument {
  if (!Number.isFinite(value)) throw new Error(`Invalid scene lab value for ${definition.id}`);
  const clamped = Math.min(definition.maximum, Math.max(definition.minimum, value));
  const quantized = definition.minimum + Math.round((clamped - definition.minimum) / definition.step) * definition.step;
  return { ...document, parameters: { ...document.parameters, [definition.id]: Number(quantized.toFixed(10)) } };
}

export function compareSceneLabDocuments(baseline: SceneLabDocument, candidate: SceneLabDocument): SceneLabComparison {
  const keys = new Set([...Object.keys(baseline.parameters), ...Object.keys(candidate.parameters)]);
  return { baseline, candidate, changedParameterIds: Array.from(keys).filter((key) => baseline.parameters[key] !== candidate.parameters[key]).sort() };
}

export function exportSceneLabCsv(document: SceneLabDocument): string {
  return ["parameter,value", ...Object.entries(document.parameters).map(([key, value]) => `${JSON.stringify(key)},${JSON.stringify(value)}`)].join("\n");
}

