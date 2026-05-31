/**
 * Solar system layout for next-web: masses from NASA Planetary Fact Sheet scale,
 * state vectors from `ephemerisGenerated.ts` (Horizons export or J2000.0 default).
 *
 * Refresh ephemeris: `python solar_sim/export_ephemeris_nextweb.py`
 */

import { EPHEMERIS_EPOCH_JD_TDB, EPHEMERIS_ROWS } from "./ephemerisGenerated";
import { NASA_MASS_KG } from "./nasaMasses";
import { planetDiffuseUrlForBody } from "./planetTextureManifest";
import { orbitDisplayColorForBodyId } from "../lib/universeSandboxOrbitPalette";

export type Vec3Au = readonly [number, number, number];

export type SolarSystemBodyDef = {
  id: string;
  name: string;
  massKg: number;
  /** Three.js sphere radius (visual only; tuned vs AU_TO_SCENE for Earth–Moon clearance). */
  radiusScene: number;
  /** Diffuse / albedo tint for MeshStandardMaterial. */
  color: string;
  /** Trail / osculating ellipse / HUD dot (Universe Sandbox–style palette). */
  orbitColor: string;
  positionAu: Vec3Au;
  velocityAuPerDay: Vec3Au;
  variant: "sun" | "planet";
  /**
   * Equirectangular albedo under `public/` (see `planetAlbedoUrl`, optional `NEXT_PUBLIC_PLANET_TEXTURE_*`).
   * If the file is missing, rendering falls back to `color`.
   */
  textureMap?: string;
  /** Optional tangent-space normal map (linear PNG/JPG). */
  normalMap?: string;
  /** Saturn: equatorial ring mesh in the body’s local XY plane. */
  showRings?: boolean;
  /** Atmospheric Fresnel glow color; omit to disable. */
  atmosphereColor?: string;
  /**
   * If false, hide the heliocentric two-body osculating ellipse (misleading for
   * planetocentric satellites).
   */
  heliocentricOsculatingOrbit?: boolean;
  /**
   * Parent body index for two-body osculating ellipse (moons). `null` = heliocentric (Sun).
   * Set in `buildBodies` from `OSCULATING_PARENT_ID_BY_SATELLITE`.
   */
  osculatingCentralBodyIndex: number | null;
};

/** Scene units per AU (Neptune ~30 AU → ~1560 units; camera pulls back). */
export const AU_TO_SCENE = 52;

/** TDB Julian Date of the loaded ephemeris (matches Horizons query epoch). */
export const EPOCH_JD_TDB = EPHEMERIS_EPOCH_JD_TDB;

/** Default “天/秒” when UI does not override (linear ephemeris demo). */
export const DEFAULT_SIM_DAYS_PER_WORLD_SECOND = 1.2;

const _ephem = Object.fromEntries(
  EPHEMERIS_ROWS.map((r) => [r.id, r])
) as Record<string, (typeof EPHEMERIS_ROWS)[number]>;

type BodyStatic = Omit<
  SolarSystemBodyDef,
  | "positionAu"
  | "velocityAuPerDay"
  | "massKg"
  | "orbitColor"
  | "osculatingCentralBodyIndex"
>;

const BODY_STATICS: BodyStatic[] = [
  {
    id: "sun",
    name: "太阳",
    radiusScene: 8.0,
    color: "#ffecd8",
    variant: "sun",
    textureMap: planetDiffuseUrlForBody("sun"),
  },
  {
    id: "mercury",
    name: "水星",
    radiusScene: 0.28,
    color: "#b8b5a8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("mercury"),
  },
  {
    id: "venus",
    name: "金星",
    radiusScene: 0.42,
    color: "#d4c49a",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("venus"),
    atmosphereColor: "#e8c870",
  },
  {
    id: "earth",
    name: "地球",
    radiusScene: 0.36,
    color: "#6b93c8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("earth"),
    atmosphereColor: "#4488ff",
  },
  {
    id: "moon",
    name: "月球",
    radiusScene: 0.08,
    color: "#a8a8a8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("moon"),
  },
  {
    id: "mars",
    name: "火星",
    radiusScene: 0.34,
    color: "#c67b5c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("mars"),
    atmosphereColor: "#c49070",
  },
  {
    id: "jupiter",
    name: "木星",
    radiusScene: 2.6,
    color: "#c9a574",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("jupiter"),
    atmosphereColor: "#d4a860",
  },
  {
    id: "saturn",
    name: "土星",
    radiusScene: 2.2,
    color: "#d4bc8c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("saturn"),
    showRings: true,
    atmosphereColor: "#c8b888",
  },
  {
    id: "uranus",
    name: "天王星",
    radiusScene: 1.3,
    color: "#7eb8c4",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("uranus"),
    atmosphereColor: "#80c8d8",
  },
  {
    id: "neptune",
    name: "海王星",
    radiusScene: 1.25,
    color: "#5b7dbe",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("neptune"),
    atmosphereColor: "#4470d0",
  },
  {
    id: "pluto",
    name: "冥王星",
    radiusScene: 0.14,
    color: "#c4b4a8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("pluto"),
  },
  {
    id: "ceres",
    name: "谷神星",
    radiusScene: 0.022,
    color: "#9a9088",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("ceres"),
  },
  {
    id: "io",
    name: "木卫一 Io",
    radiusScene: 0.032,
    color: "#c9a227",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("io"),
  },
  {
    id: "europa",
    name: "木卫二 Europa",
    radiusScene: 0.029,
    color: "#b8c5d6",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("europa"),
  },
  {
    id: "ganymede",
    name: "木卫三 Ganymede",
    radiusScene: 0.046,
    color: "#8f8a7a",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("ganymede"),
  },
  {
    id: "callisto",
    name: "木卫四 Callisto",
    radiusScene: 0.042,
    color: "#4a4540",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("callisto"),
  },
  {
    id: "titan",
    name: "土卫六 Titan",
    radiusScene: 0.044,
    color: "#c9a86a",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("titan"),
  },
  {
    id: "enceladus",
    name: "土卫二 Enceladus",
    radiusScene: 0.014,
    color: "#e8e4dc",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("enceladus"),
  },
  {
    id: "mimas",
    name: "土卫一 Mimas",
    radiusScene: 0.012,
    color: "#c4c2be",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("mimas"),
  },
  {
    id: "tethys",
    name: "土卫三 Tethys",
    radiusScene: 0.016,
    color: "#dcd8d0",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("tethys"),
  },
  {
    id: "dione",
    name: "土卫四 Dione",
    radiusScene: 0.016,
    color: "#d6d2cc",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("dione"),
  },
  {
    id: "rhea",
    name: "土卫五 Rhea",
    radiusScene: 0.019,
    color: "#cfc9c0",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("rhea"),
  },
  {
    id: "hyperion",
    name: "土卫七 Hyperion",
    radiusScene: 0.01,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("hyperion"),
  },
  {
    id: "iapetus",
    name: "土卫八 Iapetus",
    radiusScene: 0.018,
    color: "#b8b0a8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("iapetus"),
  },
  {
    id: "amalthea",
    name: "木卫五 Amalthea",
    radiusScene: 0.011,
    color: "#8a7d62",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("amalthea"),
  },
  {
    id: "phobos",
    name: "火卫一 Phobos",
    radiusScene: 0.008,
    color: "#78716c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("phobos"),
  },
  {
    id: "deimos",
    name: "火卫二 Deimos",
    radiusScene: 0.007,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("deimos"),
  },
  {
    id: "ariel",
    name: "天卫一 Ariel",
    radiusScene: 0.015,
    color: "#c8d4dc",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("ariel"),
  },
  {
    id: "umbriel",
    name: "天卫二 Umbriel",
    radiusScene: 0.016,
    color: "#6b7280",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("umbriel"),
  },
  {
    id: "titania",
    name: "天卫三 Titania",
    radiusScene: 0.019,
    color: "#d1d5db",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("titania"),
  },
  {
    id: "oberon",
    name: "天卫四 Oberon",
    radiusScene: 0.018,
    color: "#9ca3af",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("oberon"),
  },
  {
    id: "miranda",
    name: "天卫五 Miranda",
    radiusScene: 0.012,
    color: "#d4d4d8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("miranda"),
  },
  {
    id: "triton",
    name: "海卫一 Triton",
    radiusScene: 0.028,
    color: "#c5d4e0",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("triton"),
  },
  {
    id: "proteus",
    name: "海卫八 Proteus",
    radiusScene: 0.013,
    color: "#787878",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("proteus"),
  },
  {
    id: "charon",
    name: "冥卫一 Charon",
    radiusScene: 0.02,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("charon"),
  },
  {
    id: "eris",
    name: "阋神星 Eris",
    radiusScene: 0.041,
    color: "#d4cfc8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("eris"),
  },
  {
    id: "makemake",
    name: "鸟神星 Makemake",
    radiusScene: 0.034,
    color: "#b91c1c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("makemake"),
  },
  {
    id: "haumea",
    name: "妊神星 Haumea",
    radiusScene: 0.032,
    color: "#a3a3a3",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("haumea"),
  },
  {
    id: "gonggong",
    name: "共工 Gonggong",
    radiusScene: 0.03,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("gonggong"),
  },
  {
    id: "quaoar",
    name: "创神星 Quaoar",
    radiusScene: 0.028,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("quaoar"),
  },
  {
    id: "sedna",
    name: "塞德娜 Sedna",
    radiusScene: 0.026,
    color: "#7c6f64",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("sedna"),
  },
  {
    id: "orcus",
    name: "亡神星 Orcus",
    radiusScene: 0.027,
    color: "#44403c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("orcus"),
  },
  {
    id: "salacia",
    name: "Sila–Nunam Salacia",
    radiusScene: 0.024,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("salacia"),
  },
  {
    id: "vesta",
    name: "灶神星 Vesta",
    radiusScene: 0.021,
    color: "#d6cfc4",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("vesta"),
  },
  {
    id: "pallas",
    name: "智神星 Pallas",
    radiusScene: 0.022,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("pallas"),
  },
  {
    id: "hygiea",
    name: "健神星 Hygiea",
    radiusScene: 0.02,
    color: "#78716c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("hygiea"),
  },
  {
    id: "thebe",
    name: "木卫十四 Thebe",
    radiusScene: 0.01,
    color: "#a89b7a",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("thebe"),
  },
  {
    id: "metis",
    name: "木卫十六 Metis",
    radiusScene: 0.008,
    color: "#9a8b72",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("metis"),
  },
  {
    id: "adrastea",
    name: "木卫十五 Adrastea",
    radiusScene: 0.006,
    color: "#8a7d68",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("adrastea"),
  },
  {
    id: "himalia",
    name: "木卫六 Himalia",
    radiusScene: 0.014,
    color: "#78716c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("himalia"),
  },
  {
    id: "elara",
    name: "木卫七 Elara",
    radiusScene: 0.012,
    color: "#6b6560",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("elara"),
  },
  {
    id: "pasiphae",
    name: "木卫八 Pasiphae",
    radiusScene: 0.011,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("pasiphae"),
  },
  {
    id: "sinope",
    name: "木卫九 Sinope",
    radiusScene: 0.01,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("sinope"),
  },
  {
    id: "lysithea",
    name: "木卫十 Lysithea",
    radiusScene: 0.009,
    color: "#52525b",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("lysithea"),
  },
  {
    id: "carme",
    name: "木卫十一 Carme",
    radiusScene: 0.01,
    color: "#44403c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("carme"),
  },
  {
    id: "phoebe",
    name: "土卫九 Phoebe",
    radiusScene: 0.016,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("phoebe"),
  },
  {
    id: "janus",
    name: "土卫十 Janus",
    radiusScene: 0.009,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("janus"),
  },
  {
    id: "epimetheus",
    name: "土卫十一 Epimetheus",
    radiusScene: 0.008,
    color: "#9ca3af",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("epimetheus"),
  },
  {
    id: "helene",
    name: "土卫十二 Helene",
    radiusScene: 0.008,
    color: "#d6d3d1",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("helene"),
  },
  {
    id: "telesto",
    name: "土卫十三 Telesto",
    radiusScene: 0.006,
    color: "#e7e5e4",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("telesto"),
  },
  {
    id: "calypso",
    name: "土卫十四 Calypso",
    radiusScene: 0.006,
    color: "#e7e5e4",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("calypso"),
  },
  {
    id: "atlas",
    name: "土卫十五 Atlas",
    radiusScene: 0.007,
    color: "#d4d4d8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("atlas"),
  },
  {
    id: "prometheus",
    name: "土卫十六 Prometheus",
    radiusScene: 0.008,
    color: "#c4c4c8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("prometheus"),
  },
  {
    id: "pandora",
    name: "土卫十七 Pandora",
    radiusScene: 0.008,
    color: "#c4c4c8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("pandora"),
  },
  {
    id: "pan",
    name: "土卫十八 Pan",
    radiusScene: 0.005,
    color: "#fafaf9",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("pan"),
  },
  {
    id: "daphnis",
    name: "土卫三十五 Daphnis",
    radiusScene: 0.004,
    color: "#f5f5f4",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("daphnis"),
  },
  {
    id: "cordelia",
    name: "天卫六 Cordelia",
    radiusScene: 0.006,
    color: "#d4d4d8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("cordelia"),
  },
  {
    id: "ophelia",
    name: "天卫七 Ophelia",
    radiusScene: 0.006,
    color: "#d4d4d8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("ophelia"),
  },
  {
    id: "bianca",
    name: "天卫八 Bianca",
    radiusScene: 0.006,
    color: "#e5e5e5",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("bianca"),
  },
  {
    id: "portia",
    name: "天卫十二 Portia",
    radiusScene: 0.009,
    color: "#d1d5db",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("portia"),
  },
  {
    id: "puck",
    name: "天卫十五 Puck",
    radiusScene: 0.01,
    color: "#d1d5db",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("puck"),
  },
  {
    id: "naiad",
    name: "海卫三 Naiad",
    radiusScene: 0.005,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("naiad"),
  },
  {
    id: "thalassa",
    name: "海卫四 Thalassa",
    radiusScene: 0.006,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("thalassa"),
  },
  {
    id: "despina",
    name: "海卫五 Despina",
    radiusScene: 0.007,
    color: "#d1d5db",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("despina"),
  },
  {
    id: "galatea",
    name: "海卫六 Galatea",
    radiusScene: 0.008,
    color: "#d1d5db",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("galatea"),
  },
  {
    id: "larissa",
    name: "海卫七 Larissa",
    radiusScene: 0.009,
    color: "#c4c4c8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("larissa"),
  },
  {
    id: "nix",
    name: "冥卫二 Nix",
    radiusScene: 0.007,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("nix"),
  },
  {
    id: "hydra",
    name: "冥卫三 Hydra",
    radiusScene: 0.007,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("hydra"),
  },
  {
    id: "kerberos",
    name: "冥卫四 Kerberos",
    radiusScene: 0.005,
    color: "#78716c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("kerberos"),
  },
  {
    id: "styx",
    name: "冥卫五 Styx",
    radiusScene: 0.004,
    color: "#78716c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("styx"),
  },
  {
    id: "juno",
    name: "婚神星 Juno",
    radiusScene: 0.017,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("juno"),
  },
  {
    id: "hebe",
    name: "韶神星 Hebe",
    radiusScene: 0.016,
    color: "#9ca3af",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("hebe"),
  },
  {
    id: "iris",
    name: "虹神星 Iris",
    radiusScene: 0.017,
    color: "#c4b5a8",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("iris"),
  },
  {
    id: "flora",
    name: "花神星 Flora",
    radiusScene: 0.015,
    color: "#b8a99a",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("flora"),
  },
  {
    id: "lutetia",
    name: "司琴星 Lutetia",
    radiusScene: 0.016,
    color: "#78716c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("lutetia"),
  },
  {
    id: "daphne",
    name: "韬神星 Daphne",
    radiusScene: 0.015,
    color: "#78716c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("daphne"),
  },
  {
    id: "kleopatra",
    name: "艳后星 Kleopatra",
    radiusScene: 0.018,
    color: "#a16207",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("kleopatra"),
  },
  {
    id: "eros",
    name: "爱神星 Eros",
    radiusScene: 0.008,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("eros"),
  },
  {
    id: "ida",
    name: "艾女星 Ida",
    radiusScene: 0.012,
    color: "#78716c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("ida"),
  },
  {
    id: "mathilde",
    name: "玛蒂尔德 Mathilde",
    radiusScene: 0.014,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("mathilde"),
  },
  {
    id: "itokawa",
    name: "糸川 Itokawa",
    radiusScene: 0.004,
    color: "#78716c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("itokawa"),
  },
  {
    id: "steins",
    name: "斯坦斯 Steins",
    radiusScene: 0.005,
    color: "#a8a29e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("steins"),
  },
  {
    id: "varuna",
    name: "瓦鲁纳 Varuna",
    radiusScene: 0.028,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("varuna"),
  },
  {
    id: "ixion",
    name: "伊克西翁 Ixion",
    radiusScene: 0.03,
    color: "#44403c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("ixion"),
  },
  {
    id: "huya",
    name: "雨神星 Huya",
    radiusScene: 0.026,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("huya"),
  },
  {
    id: "varda",
    name: "瓦尔达 Varda",
    radiusScene: 0.027,
    color: "#44403c",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("varda"),
  },
  {
    id: "albion",
    name: "阿尔比翁 Albion (1992 QB1)",
    radiusScene: 0.024,
    color: "#57534e",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("albion"),
  },
  {
    id: "logos",
    name: "逻各斯 Logos",
    radiusScene: 0.022,
    color: "#52525b",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("logos"),
  },
  {
    id: "deucalion",
    name: "丢卡利翁 Deucalion",
    radiusScene: 0.023,
    color: "#52525b",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("deucalion"),
  },
  {
    id: "pholus",
    name: "福鲁斯 Pholus (半人马)",
    radiusScene: 0.02,
    color: "#78350f",
    variant: "planet",
    textureMap: planetDiffuseUrlForBody("pholus"),
  },
  {
    id: "artemis_sls",
    name: "Artemis / SLS",
    radiusScene: 0.012,
    color: "#d8d8e0",
    variant: "planet",
    heliocentricOsculatingOrbit: false,
  },
];

/** Parent id for two-body osculating ellipse around that body (not heliocentric). */
const OSCULATING_PARENT_ID_BY_SATELLITE: Readonly<Record<string, string>> = {
  moon: "earth",
  phobos: "mars",
  deimos: "mars",
  io: "jupiter",
  europa: "jupiter",
  ganymede: "jupiter",
  callisto: "jupiter",
  amalthea: "jupiter",
  thebe: "jupiter",
  metis: "jupiter",
  adrastea: "jupiter",
  himalia: "jupiter",
  elara: "jupiter",
  pasiphae: "jupiter",
  sinope: "jupiter",
  lysithea: "jupiter",
  carme: "jupiter",
  titan: "saturn",
  enceladus: "saturn",
  mimas: "saturn",
  tethys: "saturn",
  dione: "saturn",
  rhea: "saturn",
  hyperion: "saturn",
  iapetus: "saturn",
  phoebe: "saturn",
  janus: "saturn",
  epimetheus: "saturn",
  helene: "saturn",
  telesto: "saturn",
  calypso: "saturn",
  atlas: "saturn",
  prometheus: "saturn",
  pandora: "saturn",
  pan: "saturn",
  daphnis: "saturn",
  ariel: "uranus",
  umbriel: "uranus",
  titania: "uranus",
  oberon: "uranus",
  miranda: "uranus",
  cordelia: "uranus",
  ophelia: "uranus",
  bianca: "uranus",
  portia: "uranus",
  puck: "uranus",
  triton: "neptune",
  proteus: "neptune",
  naiad: "neptune",
  thalassa: "neptune",
  despina: "neptune",
  galatea: "neptune",
  larissa: "neptune",
  charon: "pluto",
  nix: "pluto",
  hydra: "pluto",
  kerberos: "pluto",
  styx: "pluto",
};

function buildBodies(): SolarSystemBodyDef[] {
  return BODY_STATICS.map((b) => {
    const e = _ephem[b.id];
    if (!e) throw new Error(`Missing ephemeris for ${b.id}`);
    const m = NASA_MASS_KG[b.id];
    if (m === undefined) throw new Error(`Missing NASA mass for ${b.id}`);
    const parentId = OSCULATING_PARENT_ID_BY_SATELLITE[b.id];
    let osculatingCentralBodyIndex: number | null = null;
    if (parentId !== undefined) {
      const pi = BODY_STATICS.findIndex((x) => x.id === parentId);
      if (pi < 0) throw new Error(`Missing parent body ${parentId} for satellite ${b.id}`);
      osculatingCentralBodyIndex = pi;
    }
    return {
      ...b,
      massKg: m,
      positionAu: e.positionAu,
      velocityAuPerDay: e.velocityAuPerDay,
      orbitColor: orbitDisplayColorForBodyId(b.id),
      osculatingCentralBodyIndex,
    };
  });
}

export const SOLAR_SYSTEM_BODIES: SolarSystemBodyDef[] = buildBodies();

/** Name tags for every simulated body when “显示天体名称” is on. */
export const MAJOR_BODY_LABEL_IDS: ReadonlySet<string> = new Set(
  SOLAR_SYSTEM_BODIES.map((b) => b.id)
);

/** `SOLAR_SYSTEM_BODIES` 中的下标（供相机 / UI 引用）。 */
export const EARTH_BODY_INDEX = SOLAR_SYSTEM_BODIES.findIndex(
  (b) => b.id === "earth"
);
export const MOON_BODY_INDEX = SOLAR_SYSTEM_BODIES.findIndex(
  (b) => b.id === "moon"
);
export const MERCURY_BODY_INDEX = SOLAR_SYSTEM_BODIES.findIndex(
  (b) => b.id === "mercury"
);
/** Spacecraft body index for Artemis SLS launch simulation. */
export const SPACECRAFT_BODY_INDEX = SOLAR_SYSTEM_BODIES.findIndex(
  (b) => b.id === "artemis_sls"
);

/** 地月专用视角下仅用于网格显示的放大倍数（物理位置不变）。 */
export const EARTH_MOON_VIEW_MESH_SCALE = {
  earth: 1.34,
  moon: 2.25,
} as const;

/** Fast-moving heliocentric bodies + major satellites (tighter trails). */
const HIGH_RES_TRAIL_IDS = new Set<string>([
  "mercury",
  "venus",
  "earth",
  "moon",
  "mars",
  "io",
  "europa",
  "ganymede",
  "callisto",
  "titan",
  "enceladus",
  "mimas",
  "tethys",
  "dione",
  "rhea",
  "hyperion",
  "iapetus",
  "amalthea",
  "phobos",
  "deimos",
  "ariel",
  "umbriel",
  "titania",
  "oberon",
  "miranda",
  "triton",
  "proteus",
  "charon",
  "thebe",
  "metis",
  "adrastea",
  "naiad",
  "thalassa",
  "despina",
  "galatea",
  "larissa",
  "nix",
  "hydra",
  "kerberos",
  "styx",
  "cordelia",
  "ophelia",
  "bianca",
  "portia",
  "puck",
  "janus",
  "epimetheus",
  "telesto",
  "calypso",
  "pan",
  "daphnis",
]);

/** Energy-trail cap: only the last N world samples (see OrbitTrail). */
const ORBIT_TRAIL_MAX_SAMPLES_PLANET = 1000;
const ORBIT_TRAIL_MAX_SAMPLES_MOON = 300;

/** Eight major planets get longer trails; moons/asteroids get shorter ones. */
export const MAJOR_PLANET_IDS = new Set([
  "mercury", "venus", "earth", "mars",
  "jupiter", "saturn", "uranus", "neptune",
]);

/** Denser sampling for inner / high-interest bodies. */
export function orbitTrailParams(def: SolarSystemBodyDef): {
  maxPoints: number;
  minVertexDistance: number;
} {
  if (def.variant !== "planet") {
    return { maxPoints: 0, minVertexDistance: 0.02 };
  }
  if (MAJOR_PLANET_IDS.has(def.id)) {
    return { maxPoints: ORBIT_TRAIL_MAX_SAMPLES_PLANET, minVertexDistance: 0.006 };
  }
  if (HIGH_RES_TRAIL_IDS.has(def.id)) {
    return { maxPoints: ORBIT_TRAIL_MAX_SAMPLES_MOON, minVertexDistance: 0.008 };
  }
  return { maxPoints: ORBIT_TRAIL_MAX_SAMPLES_MOON, minVertexDistance: 0.01 };
}
