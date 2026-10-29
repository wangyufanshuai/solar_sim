import { ASTERISM_LINES } from "../data/asterismCatalog";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE_V255 } from "../data/nebulaCatalogV255";
import { STAR_CLUSTERS_V255 } from "../data/starClusterCatalogV255";
import {
  ATLAS_GAIA_STARFIELD_EXPANSION_COUNTS,
  ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET,
  createAtlasGaiaStarfieldExpansionSummary,
  type AtlasGaiaStarfieldExpansionSummary,
} from "./atlasGaiaStarfieldExpansionV255";

export type AtlasGaiaStarfieldExpansionAudit = {
  id: "gaia-row-count" | "iau-constellation-count" | "asterism-count" | "deep-sky-count" | "budget-boundary";
  status: "ready" | "regressed";
  measured: string;
  expected: string;
};

export function runAtlasGaiaStarfieldExpansionAudit(args: {
  gaiaRowCount?: number;
  mobileBudget?: number;
  balancedBudget?: number;
  denseBudget?: number;
  closeupBudget?: number;
} = {}): {
  audits: readonly AtlasGaiaStarfieldExpansionAudit[];
  summary: AtlasGaiaStarfieldExpansionSummary;
} {
  const measuredGaia = args.gaiaRowCount ?? 0;
  const measuredMobile = args.mobileBudget ?? ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET.mobile;
  const measuredBalanced = args.balancedBudget ?? ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET.balanced;
  const measuredDense = args.denseBudget ?? ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET.dense;
  const measuredCloseup = args.closeupBudget ?? ATLAS_GAIA_STARFIELD_EXPANSION_RENDER_BUDGET.closeup;
  const audits: AtlasGaiaStarfieldExpansionAudit[] = [
    audit("gaia-row-count", measuredGaia, ATLAS_GAIA_STARFIELD_EXPANSION_COUNTS.gaiaRows),
    audit("iau-constellation-count", CONSTELLATION_LINES.length, ATLAS_GAIA_STARFIELD_EXPANSION_COUNTS.iauConstellations),
    audit("asterism-count", ASTERISM_LINES.length, ATLAS_GAIA_STARFIELD_EXPANSION_COUNTS.asterisms),
    audit("deep-sky-count", NEBULAE_V255.length + STAR_CLUSTERS_V255.length, ATLAS_GAIA_STARFIELD_EXPANSION_COUNTS.nebulae + ATLAS_GAIA_STARFIELD_EXPANSION_COUNTS.starClusters),
    {
      id: "budget-boundary",
      status: measuredMobile === 1000 && measuredBalanced === 4000 && measuredDense === 8000 && measuredCloseup <= 1200 ? "ready" : "regressed",
      measured: `mobile ${measuredMobile}; balanced ${measuredBalanced}; dense ${measuredDense}; closeup ${measuredCloseup}`,
      expected: "mobile 1000; balanced 4000; dense 8000; closeup <= 1200",
    },
  ];
  const ready = audits.every((item) => item.status === "ready");
  return {
    audits,
    summary: createAtlasGaiaStarfieldExpansionSummary({ status: ready ? "ready" : "blocked" }),
  };
}

function audit(
  id: AtlasGaiaStarfieldExpansionAudit["id"],
  measured: number,
  expected: number,
): AtlasGaiaStarfieldExpansionAudit {
  return {
    id,
    status: measured === expected ? "ready" : "regressed",
    measured: String(measured),
    expected: String(expected),
  };
}
