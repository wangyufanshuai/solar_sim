"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV548 } from "../lib/kerrPhotonMetrologyObservatoryIntentV548";
import { KERR_PHOTON_METROLOGY_DETAILS_V547, KERR_PHOTON_METROLOGY_LABELS_V547 } from "./kerrPhotonMetrologyDetailCatalogV547";
type IdV548 = Exclude<KerrPhotonMetrologyDetailSurfaceV548, "none">; type LazyDetailV548 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V548 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V547, "observation-quantity-provenance": lazy(() => import("./KerrObservationQuantityProvenanceV548")) } satisfies Readonly<Record<IdV548, LazyDetailV548>>);
export const KERR_PHOTON_METROLOGY_LABELS_V548 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V547, "observation-quantity-provenance": "Observation quantity provenance" } satisfies Readonly<Record<IdV548, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V548 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V548) as IdV548[]);
