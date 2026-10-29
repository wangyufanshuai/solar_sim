import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  canonicalKerrPhysicalObservationTemplateShaV399,
  parseKerrPhysicalObservationTemplateArtifactV399,
  validateKerrPhysicalObservationTemplateV399,
  type KerrPhysicalObservationTemplateArtifactV399,
  type KerrPhysicalObservationTemplateV399,
} from "./kerrPhysicalObservationTemplateV399";

const ARTIFACT_PATH = "dist/science/kerr-physical-observation-template-v399/template-diagnostic.json";
const TEMPLATE_PATH = "dist/templates/kerr-physical-observation-v399/intake-template.json";
let cache: { fingerprint: string; promise: Promise<{ artifact: KerrPhysicalObservationTemplateArtifactV399; template: KerrPhysicalObservationTemplateV399 }> } | null = null;
const sha = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const canonicalize = (value: unknown): unknown => Array.isArray(value) ? value.map(canonicalize) : !value || typeof value !== "object" ? value : Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !["generatedAt", "artifactSha256"].includes(key)).sort(([left], [right]) => left.localeCompare(right)).map(([key, entry]) => [key, canonicalize(entry)]));

export async function loadKerrPhysicalObservationTemplateV399(root = process.cwd()) {
  const artifactPath = resolve(root, ARTIFACT_PATH);
  const templatePath = resolve(root, TEMPLATE_PATH);
  const [artifactMetadata, templateMetadata] = await Promise.all([stat(artifactPath), stat(templatePath)]);
  if (!artifactMetadata.isFile() || artifactMetadata.size <= 0 || artifactMetadata.size > 128 * 1024 || !templateMetadata.isFile() || templateMetadata.size <= 0 || templateMetadata.size > 128 * 1024) throw new Error("v399-template-size");
  const [artifactBytes, templateBytes] = await Promise.all([readFile(artifactPath), readFile(templatePath)]);
  const fingerprint = `${artifactMetadata.size}:${artifactMetadata.mtimeMs}:${sha(artifactBytes)}:${templateMetadata.size}:${templateMetadata.mtimeMs}:${sha(templateBytes)}`;
  if (cache?.fingerprint === fingerprint) return cache.promise;
  const promise = Promise.resolve().then(() => {
    const artifact = parseKerrPhysicalObservationTemplateArtifactV399(JSON.parse(artifactBytes.toString("utf8")));
    const template = JSON.parse(templateBytes.toString("utf8")) as KerrPhysicalObservationTemplateV399;
    if (sha(JSON.stringify(canonicalize(artifact))) !== artifact.artifactSha256 || validateKerrPhysicalObservationTemplateV399(template, artifact.source.v398IntakeArtifactSha256).status !== "qualified-template-only" || canonicalKerrPhysicalObservationTemplateShaV399(template) !== artifact.integrity.templateCanonicalSha256) throw new Error("v399-template-sha");
    return Object.freeze({ artifact, template });
  });
  cache = { fingerprint, promise };
  try { return await promise; } catch (error) { if (cache?.promise === promise) cache = null; throw error; }
}

export function resetKerrPhysicalObservationTemplateServerV399CacheForTests() { cache = null; }
