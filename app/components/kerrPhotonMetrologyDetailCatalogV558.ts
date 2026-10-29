"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV558 } from "../lib/kerrPhotonMetrologyObservatoryIntentV558";
import { KERR_PHOTON_METROLOGY_DETAILS_V557, KERR_PHOTON_METROLOGY_LABELS_V557 } from "./kerrPhotonMetrologyDetailCatalogV557";
type IdV558 = Exclude<KerrPhotonMetrologyDetailSurfaceV558, "none">; type LazyDetailV558 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V558 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V557, "response-provenance-pack": lazy(() => import("./KerrResponseProvenancePackV558")) } satisfies Readonly<Record<IdV558, LazyDetailV558>>);
export const KERR_PHOTON_METROLOGY_LABELS_V558 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V557, "response-provenance-pack": "Response / observation provenance" } satisfies Readonly<Record<IdV558, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V558 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V558) as IdV558[]);
