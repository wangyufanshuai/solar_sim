"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV546 } from "../lib/kerrPhotonMetrologyObservatoryIntentV546";
import { KERR_PHOTON_METROLOGY_DETAILS_V545, KERR_PHOTON_METROLOGY_LABELS_V545 } from "./kerrPhotonMetrologyDetailCatalogV545";
type IdV546 = Exclude<KerrPhotonMetrologyDetailSurfaceV546, "none">; type LazyDetailV546 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V546 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V545, "independent-fits-validation": lazy(() => import("./KerrIndependentFitsValidationV546")) } satisfies Readonly<Record<IdV546, LazyDetailV546>>);
export const KERR_PHOTON_METROLOGY_LABELS_V546 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V545, "independent-fits-validation": "Independent FITS validation" } satisfies Readonly<Record<IdV546, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V546 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V546) as IdV546[]);
