"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV547 } from "../lib/kerrPhotonMetrologyObservatoryIntentV547";
import { KERR_PHOTON_METROLOGY_DETAILS_V546, KERR_PHOTON_METROLOGY_LABELS_V546 } from "./kerrPhotonMetrologyDetailCatalogV546";
type IdV547 = Exclude<KerrPhotonMetrologyDetailSurfaceV547, "none">; type LazyDetailV547 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V547 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V546, "blind-authority-review": lazy(() => import("./KerrBlindAuthorityReviewV547")) } satisfies Readonly<Record<IdV547, LazyDetailV547>>);
export const KERR_PHOTON_METROLOGY_LABELS_V547 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V546, "blind-authority-review": "Blind authority review" } satisfies Readonly<Record<IdV547, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V547 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V547) as IdV547[]);
