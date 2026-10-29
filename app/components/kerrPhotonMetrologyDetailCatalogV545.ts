"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV545 } from "../lib/kerrPhotonMetrologyObservatoryIntentV545";
import { KERR_PHOTON_METROLOGY_DETAILS_V544, KERR_PHOTON_METROLOGY_LABELS_V544 } from "./kerrPhotonMetrologyDetailCatalogV544";
type IdV545 = Exclude<KerrPhotonMetrologyDetailSurfaceV545, "none">; type LazyDetailV545 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V545 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V544, "supplemental-calibration-intake": lazy(() => import("./KerrSupplementalCalibrationIntakeV545")) } satisfies Readonly<Record<IdV545, LazyDetailV545>>);
export const KERR_PHOTON_METROLOGY_LABELS_V545 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V544, "supplemental-calibration-intake": "Supplemental calibration intake" } satisfies Readonly<Record<IdV545, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V545 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V545) as IdV545[]);
