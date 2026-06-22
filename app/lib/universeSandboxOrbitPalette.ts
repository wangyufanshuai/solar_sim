/**
 * Per-body orbit display colors (hex strings for data layer / HUD dots).
 * Matches the orbit line colors in orbitCinematicTokens.ts.
 */

/** Sun HUD dot — muted warm neutral. */
export const ORBIT_SUN_HUD = "#c8b8a0";

/**
 * Body-ID → orbit display color (hex string).
 * Shared color map used by both orbit line rendering and reference orbit data.
 */
const BODY_DISPLAY_COLORS: Record<string, string> = {
  sun: "#c8b8a0",
  mercury: "#a09898",
  venus: "#c8aa72",
  earth: "#4488cc",
  moon: "#9a9a9a",
  mars: "#cc6633",
  jupiter: "#cc9944",
  saturn: "#ddbb66",
  uranus: "#44bbbb",
  neptune: "#3366cc",
  pluto: "#aa8866",

  phobos: "#a08870",
  deimos: "#988068",

  ceres: "#b89870",
  vesta: "#a88860",
  pallas: "#c0a070",
  hygiea: "#b09060",
  juno: "#a09080",
  hebe: "#988870",
  iris: "#b8a080",
  flora: "#a89070",
  lutetia: "#908070",
  daphne: "#b09878",
  kleopatra: "#a08868",
  eros: "#c0a888",
  ida: "#b09070",
  mathilde: "#907860",
  itokawa: "#a89880",
  steins: "#988878",

  haumea: "#5577aa",
  makemake: "#6688bb",
  eris: "#7755aa",
  sedna: "#8866aa",
  quaoar: "#5577bb",
  orcus: "#6688aa",
  gonggong: "#7766bb",
  salacia: "#5588aa",

  chiron: "#aa7744",
  pholus: "#bb8855",
  nessus: "#aa8844",

  halley: "#cc8844",
  hale_bopp: "#ddaa66",
  encke: "#cc9955",
};

/** Default fallback colors by body category. */
const CATEGORY_DEFAULTS: Record<string, string> = {
  asteroid: "#b89870",
  kbo: "#5577aa",
  centaur: "#aa7744",
  comet: "#cc8844",
  planet: "#8899aa",
};

/** Get display color for a body by ID. Falls back by category pattern, then generic. */
export function orbitDisplayColorForBodyId(id: string): string {
  const direct = BODY_DISPLAY_COLORS[id];
  if (direct) return direct;

  // Heuristic category fallback based on known ID patterns
  if (id === "sun") return ORBIT_SUN_HUD;
  const lower = id.toLowerCase();
  if (lower.includes("halley") || lower.includes("hale") || lower.includes("encke") || lower.includes("comet")) return CATEGORY_DEFAULTS.comet!;
  if (lower.includes("chiron") || lower.includes("pholus") || lower.includes("nessus") || lower.includes("centaur")) return CATEGORY_DEFAULTS.centaur!;
  if (lower.includes("eris") || lower.includes("sedna") || lower.includes("makemake") || lower.includes("haumea") || lower.includes("quaoar") || lower.includes("orcus") || lower.includes("gonggong") || lower.includes("salacia")) return CATEGORY_DEFAULTS.kbo!;
  if (lower.includes("ceres") || lower.includes("vesta") || lower.includes("pallas") || lower.includes("hygiea") || lower.includes("juno") || lower.includes("eros") || lower.includes("ida") || lower.includes("mathilde")) return CATEGORY_DEFAULTS.asteroid!;

  return "#8899aa";
}
