import {
  FINAL_ART_CONTENT_PACK_INDEX_SHA256_V593,
  FINAL_ART_FREEZE_BEFORE_SHA256_V593,
  FINAL_ART_MANIFEST_SHA256_V593,
  FINAL_ART_SOURCE_MANIFEST_SHA256_V593,
} from "../data/finalArtDirectionManifestV593.generated";
import { LIVING_UNIVERSE_MANIFEST_SHA256_V592 } from "./livingUniverseV592";

export const FINAL_ART_DIRECTION_VERSION_V593 = "v593-final-art-direction-product-rc-candidate-v1" as const;
export const FINAL_ART_DIRECTION_ROUTE_V593 = "/local-shadow-v593" as const;
export const FINAL_ART_DIRECTION_FORMAL_PRODUCT_POINTER_V593 = "v263" as const;
export const FINAL_ART_DIRECTION_BASELINE_V593 = "v592-readonly" as const;
export const FINAL_ART_DIRECTION_SCIENTIFIC_PAYLOAD_SHA256_V593 = "784ddb4c94aa836b3dc6e517fa559178ae626f6aa5210b52b5ff8cd771785674" as const;

export {
  FINAL_ART_CONTENT_PACK_INDEX_SHA256_V593,
  FINAL_ART_FREEZE_BEFORE_SHA256_V593,
  FINAL_ART_MANIFEST_SHA256_V593,
  FINAL_ART_SOURCE_MANIFEST_SHA256_V593,
};

export type FinalArtDeliveryTierV593 = "vercel-lite" | "standalone-full";
export type FinalArtPrimaryContextKindV593 =
  | "body-hero"
  | "stellar-hero"
  | "major-moon-hero"
  | "nebula-reference"
  | "deep-space-reference"
  | "sky-reference";

export type FinalArtPrimaryContextV593 = Readonly<{
  kind: FinalArtPrimaryContextKindV593;
  id: string;
  label: string;
  secondaryBodyId: string | null;
  presentationOnly: boolean;
}>;

export type FinalArtBudgetProjectionV593 = Readonly<{
  currentBytes: number;
  externalizedBytes: number;
  projectedBytes: number;
  targetMaximumBytes: number;
  headroomBytes: number;
  status: "passed" | "blocked";
}>;

export const FINAL_ART_BUDGETS_V593 = Object.freeze({
  liteShellMaximumBytes: 78 * 1024 * 1024,
  observatoryDefaultMaximumBytes: 720 * 1024 * 1024,
  inheritedLiteBytes: 85_970_228,
  inheritedFullBytes: 783_308_519,
});

export function evaluateFinalArtBudgetV593(
  currentBytes: number,
  externalizedBytes: number,
  targetMaximumBytes: number,
): FinalArtBudgetProjectionV593 {
  if (![currentBytes, externalizedBytes, targetMaximumBytes].every(Number.isSafeInteger)) {
    throw new Error("v593-budget-integer-required");
  }
  if (currentBytes < 0 || externalizedBytes < 0 || targetMaximumBytes <= 0 || externalizedBytes > currentBytes) {
    throw new Error("v593-budget-range");
  }
  const projectedBytes = currentBytes - externalizedBytes;
  const headroomBytes = targetMaximumBytes - projectedBytes;
  return Object.freeze({
    currentBytes,
    externalizedBytes,
    projectedBytes,
    targetMaximumBytes,
    headroomBytes,
    status: headroomBytes >= 0 ? "passed" : "blocked",
  });
}

export const FINAL_ART_CONTENT_PACK_POLICY_V593 = Object.freeze({
  baselineManifestSha256: LIVING_UNIVERSE_MANIFEST_SHA256_V592,
  shell: Object.freeze({
    id: "v593-lite-shell",
    deliveryTier: "vercel-lite" as const,
    maximumBytes: FINAL_ART_BUDGETS_V593.liteShellMaximumBytes,
    residency: "initial" as const,
  }),
  observatory: Object.freeze({
    id: "v593-observatory-default",
    deliveryTier: "standalone-full" as const,
    maximumBytes: FINAL_ART_BUDGETS_V593.observatoryDefaultMaximumBytes,
    residency: "initial" as const,
  }),
  optional: Object.freeze([
    Object.freeze({
      id: "v593-lite-surface-detail",
      deliveryTier: "vercel-lite" as const,
      residency: "focus-demand" as const,
      focusFamilies: Object.freeze(["moon", "venus", "bennu", "mars"]),
    }),
    Object.freeze({
      id: "v593-deep-field-observations",
      deliveryTier: "standalone-full" as const,
      residency: "focus-demand" as const,
      focusFamilies: Object.freeze(["galaxies", "clusters"]),
    }),
  ]),
  maximumResidentHighResolutionBodyPacks: 1,
  sourceMutationAllowed: false,
});

export const FINAL_ART_ACCEPTED_SOURCE_BOUNDARIES_V593 = Object.freeze([
  Object.freeze({
    id: "bennu-absolute-w0",
    state: "rotation-reference-blocked" as const,
    runtimePolicy: "deterministic-kinematics-only",
  }),
  Object.freeze({
    id: "kleopatra-absolute-w0",
    state: "rotation-reference-blocked" as const,
    runtimePolicy: "deterministic-kinematics-only",
  }),
  ...["triton", "miranda", "titania"].map((id) => Object.freeze({
    id: `${id}-global-visual-asset`,
    state: "asset-blocked" as const,
    runtimePolicy: "catalog-only-no-procedural-fallback",
  })),
  Object.freeze({
    id: "iau-constellation-boundaries",
    state: "source-not-admitted" as const,
    runtimePolicy: "gaia-anchored-lines-and-labels-only",
  }),
]);

export const FINAL_ART_SIGNATURE_PASSES_V593 = Object.freeze([
  Object.freeze({ id: "sun", label: "Solar photosphere and restrained corona", state: "implemented-code-gates-pending" as const }),
  Object.freeze({ id: "earth", label: "Ocean, relief, cloud shadow, nightside and atmosphere", state: "implemented-code-gates-pending" as const }),
  Object.freeze({ id: "jupiter", label: "Seam-free bands and stable Great Red Spot framing", state: "implemented-code-gates-pending" as const }),
  Object.freeze({ id: "saturn", label: "Ring optical depth, fine structure and bidirectional shadow", state: "implemented-code-gates-pending" as const }),
  Object.freeze({ id: "stellar-archetypes", label: "Sirius, Sun, Betelgeuse and Rigel/Antares archetypes", state: "implemented-code-gates-pending" as const }),
  Object.freeze({ id: "deep-sky", label: "Milky Way, Orion, representative nebula and Andromeda", state: "implemented-code-gates-pending" as const }),
]);

const DESKTOP_GOLDEN_FRAMES_V593 = [
  "overview-science",
  "overview-cinematic",
  "overview-cinematic-clean",
  "galactic-core-science",
  "galactic-core-cinematic",
  "galactic-anticenter-science",
  "galactic-anticenter-cinematic",
  "sun-science",
  "sun-cinematic",
  "earth-science-day",
  "earth-cinematic-day",
  "earth-cinematic-night",
  "earth-science-limb",
  "jupiter-science",
  "jupiter-cinematic-grs",
  "saturn-science-front",
  "saturn-cinematic-backlight",
  "saturn-cinematic-ring-shadow",
  "sirius-science",
  "sirius-cinematic",
  "betelgeuse-science",
  "betelgeuse-cinematic",
  "orion-science",
  "orion-cinematic",
  "ursa-major-science",
  "ursa-major-cinematic",
  "cassiopeia-science",
  "cassiopeia-cinematic",
  "orion-nebula-science",
  "orion-nebula-cinematic",
  "heart-nebula-science",
  "heart-nebula-cinematic",
  "andromeda-science",
  "andromeda-cinematic",
  "pleiades-science",
  "pleiades-cinematic",
] as const;

const MOBILE_GOLDEN_FRAMES_V593 = [
  "overview-cinematic",
  "earth-cinematic",
  "jupiter-cinematic",
  "saturn-cinematic",
  "orion-cinematic",
  "andromeda-cinematic",
] as const;

export const FINAL_ART_GOLDEN_MATRIX_V593 = Object.freeze([
  ...DESKTOP_GOLDEN_FRAMES_V593.map((id) => Object.freeze({ id: `desktop-${id}`, viewport: "1440x900" as const })),
  ...MOBILE_GOLDEN_FRAMES_V593.map((id) => Object.freeze({ id: `mobile-${id}`, viewport: "390x844" as const })),
]);

const SKY_REFERENCE_LABELS_V593 = Object.freeze({
  "milky-way-center": "Milky Way · Galactic core",
  "milky-way-anticenter": "Milky Way · Anticenter",
  orion: "Orion · 猎户座",
  "ursa-major": "Ursa Major · 大熊座",
  cassiopeia: "Cassiopeia · 仙后座",
} satisfies Readonly<Record<string, string>>);

export function resolvePrimaryObservationContextV593(values: Readonly<{
  selectedObjectKind: string;
  selectedObjectId: string;
  selectedBodyId: string;
  focusTarget: string;
}>): FinalArtPrimaryContextV593 {
  const skyLabel = SKY_REFERENCE_LABELS_V593[values.focusTarget as keyof typeof SKY_REFERENCE_LABELS_V593];
  if (skyLabel) {
    return Object.freeze({
      kind: "sky-reference",
      id: values.focusTarget,
      label: skyLabel,
      secondaryBodyId: values.selectedBodyId || null,
      presentationOnly: true,
    });
  }
  const kind = new Set<FinalArtPrimaryContextKindV593>([
    "body-hero",
    "stellar-hero",
    "major-moon-hero",
    "nebula-reference",
    "deep-space-reference",
  ]).has(values.selectedObjectKind as FinalArtPrimaryContextKindV593)
    ? values.selectedObjectKind as FinalArtPrimaryContextKindV593
    : values.selectedObjectKind === "expanded-nebula"
      ? "nebula-reference"
      : "body-hero";
  return Object.freeze({
    kind,
    id: values.selectedObjectId || values.selectedBodyId,
    label: values.selectedObjectId || values.selectedBodyId,
    secondaryBodyId: kind === "body-hero" ? null : values.selectedBodyId || null,
    presentationOnly: kind === "nebula-reference" || kind === "deep-space-reference",
  });
}

export const FINAL_ART_DIRECTION_BOUNDARY_V593 = Object.freeze({
  additiveOnly: true,
  formalProductPointer: FINAL_ART_DIRECTION_FORMAL_PRODUCT_POINTER_V593,
  baseline: FINAL_ART_DIRECTION_BASELINE_V593,
  baselineManifestSha256: LIVING_UNIVERSE_MANIFEST_SHA256_V592,
  scientificPayloadSha256: FINAL_ART_DIRECTION_SCIENTIFIC_PAYLOAD_SHA256_V593,
  scientificPayloadWriteback: false,
  scientificAuthorityChanged: false,
  measuredAuthorityGranted: false,
  gpuAuthorityGranted: false,
  radiativeTransferGranted: false,
  productionReleaseAuthorized: false,
  gitMutationAllowed: false,
  singleCanvasRequired: true,
  catalogExpansionAllowed: false,
});
