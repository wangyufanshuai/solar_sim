import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrPhysicalObservationTemplateShaV399,
  createKerrPhysicalObservationProvenanceTopologyV399,
  createKerrPhysicalObservationTemplateAdversarialFixturesV399,
  createKerrPhysicalObservationTemplateV399,
  parseKerrPhysicalObservationTemplateArtifactV399,
  validateKerrPhysicalObservationTemplateV399,
} from "./kerrPhysicalObservationTemplateV399";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const intake = () => read("dist/science/kerr-physical-observation-intake-v398/intake-inspect.json");

describe("v399 physical observation template", () => {
  it("builds 13 value-free slots that cannot compile or publish", () => {
    const template = createKerrPhysicalObservationTemplateV399(intake().artifactSha256);
    expect(validateKerrPhysicalObservationTemplateV399(template, intake().artifactSha256)).toMatchObject({ status: "qualified-template-only", checkedSlotCount: 13 });
    expect(template).toMatchObject({ templateOnly: true, containsObservationValues: false, compileEligible: false, publicationAllowed: false, measuredAuthorityAllowed: false });
    expect(JSON.stringify(template)).not.toMatch(/"(?:value|exampleValue|sampleValue)"\s*:/);
  });

  it("rejects all template promotion and integrity attacks", () => {
    const fixtures = createKerrPhysicalObservationTemplateAdversarialFixturesV399(intake().artifactSha256);
    expect(fixtures).toHaveLength(8);
    for (const fixture of fixtures) {
      const result = validateKerrPhysicalObservationTemplateV399(fixture.value, intake().artifactSha256);
      expect(result.status, fixture.id).toBe("rejected");
      expect(result.rejectionReasons, fixture.id).toContain(fixture.expectedReason);
    }
  });

  it("publishes only a required topology with no actual sources", () => {
    const topology = createKerrPhysicalObservationProvenanceTopologyV399();
    expect(topology).toMatchObject({ nodeCount: 16, edgeCount: 15, actualSourceCount: 0 });
    expect(topology.nodes.every((node) => node.actual === false)).toBe(true);
    const artifact = read("dist/science/kerr-physical-observation-template-v399/template-diagnostic.json");
    const template = read("dist/templates/kerr-physical-observation-v399/intake-template.json");
    expect(parseKerrPhysicalObservationTemplateArtifactV399(artifact)).toBe(artifact);
    expect(artifact.integrity.templateCanonicalSha256).toBe(canonicalKerrPhysicalObservationTemplateShaV399(template));
    expect(artifact.productionAdmission).toMatchObject({ physicalStagingAvailable: false, physicalObservationValuesAvailable: false, templateUsedAsObservation: false, compileExecuted: false, candidatePublished: false, measuredAuthorityGranted: false });
  });
});
