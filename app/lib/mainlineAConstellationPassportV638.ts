import {
  MAINLINE_A_CONSTELLATION_FIGURES_V607,
  type MainlineAConstellationFigureV607,
} from "../data/mainlineAConstellationFiguresV607";

export type MainlineAConstellationPassportStarV638 = Readonly<{
  id: string;
  label: string;
  sourceRef: string;
  rawArtifactSha256: string | null;
}>;

export type MainlineAConstellationPassportV638 = Readonly<{
  status: "candidate-only" | "incomplete" | "unavailable";
  representativeStars: readonly MainlineAConstellationPassportStarV638[];
  missingAnchorIds: readonly string[];
  scientificPayloadWriteback: false;
}>;

/** Display labels follow the same explicit member identities as both figures.
 * Legacy prose is never a fallback for a missing or unresolved named anchor. */
export function resolveMainlineAConstellationPassportV638(
  code: string,
  figures: Readonly<Record<string, MainlineAConstellationFigureV607>> = MAINLINE_A_CONSTELLATION_FIGURES_V607,
): MainlineAConstellationPassportV638 {
  const figure = figures[code];
  if (!figure) return { status: "unavailable", representativeStars: [], missingAnchorIds: [], scientificPayloadWriteback: false };
  const representativeStars: MainlineAConstellationPassportStarV638[] = [];
  const missing = new Set(figure.missingAnchorIds);
  for (const id of figure.requiredAnchorIds) {
    const matches = figure.stars.filter((star) => star.id === id);
    const star = matches[0];
    if (matches.length !== 1 || !star || star.constellationCode !== code
      || !star.name.trim() || !star.nameCn.trim() || !star.sourceRef.trim()) {
      missing.add(id);
      continue;
    }
    representativeStars.push({ id, label: `${star.name} / ${star.nameCn}`,
      sourceRef: star.sourceRef, rawArtifactSha256: star.rawArtifactSha256 });
  }
  return {
    status: figure.sourceComplete && missing.size === 0 ? "candidate-only" : "incomplete",
    representativeStars,
    missingAnchorIds: [...missing],
    scientificPayloadWriteback: false,
  };
}
