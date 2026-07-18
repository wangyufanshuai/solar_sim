import { atlasPublicAssetUrl } from "./atlasDeliveryProfile";

export type OrbitGeometryProvenance="reported"|"derived-kepler-display"|"layout-only";
export type ExoplanetOrbitDocument={id:string;name:string;semiMajorAxisAu:number|null;periodDays:number|null;eccentricity:number|null;inclinationDeg:number|null;ascendingNodeDeg:number|null;argumentPeriastronDeg:number|null;radiusEarth:number|null;massEarth:number|null;discoveryYear:number|null;geometryProvenance:OrbitGeometryProvenance;eccentricityProvenance:"reported"|"unknown-dashed-layout";orientationProvenance:"reported"|"display-orientation";phaseProvenance:"display-phase"};
export type ExoplanetSystemDocument={id:string;hostName:string;aliases:readonly string[];raDeg:number|null;decDeg:number|null;stellarMassSolar:number|null;stellarTeffK:number|null;stellarRadiusSolar:number|null;planets:readonly ExoplanetOrbitDocument[];source:"NASA Exoplanet Archive pscomppars";retrievedAt:string};
export const EXOPLANET_CATALOG_MANIFEST_URL="/data/exoplanets/manifest.json";
export type ExoplanetSystemSearchPosting={normalizedHost:string;systemId:string;shardId:string};
export type ExoplanetSystemManifestV2={version:"v127-exoplanet-atlas-complete-ux";systemCount:number;planetCount:number;runtimePolicy:"offline-system-shards";shards:readonly{id:string;path:string;systemCount:number;sha256:string}[];index:Record<string,string>;searchPostingsPath:string;provenance:Record<string,unknown>};
export const EXOPLANET_CATALOG_V2_MANIFEST_URL=atlasPublicAssetUrl("data/exoplanets-v2/manifest.json");
export function displaySemiMajorAxisAu(periodDays:number|null,massSolar:number|null){return periodDays&&massSolar?Math.cbrt(massSolar*(periodDays/365.25)**2):null}
export function deterministicDisplayPhase(id:string){let h=2166136261;for(const c of id)h=Math.imul(h^c.charCodeAt(0),16777619);return((h>>>0)%360)*Math.PI/180}
