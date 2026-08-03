"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV544 } from "../lib/kerrPhotonMetrologyObservatoryIntentV544";
import { KERR_PHOTON_METROLOGY_DETAILS_V543, KERR_PHOTON_METROLOGY_LABELS_V543 } from "./kerrPhotonMetrologyDetailCatalogV543";
type IdV544 = Exclude<KerrPhotonMetrologyDetailSurfaceV544, "none">; type LazyDetailV544 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V544 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V543, "calibration-authority-gap": lazy(() => import("./KerrCalibrationAuthorityGapV544")) } satisfies Readonly<Record<IdV544, LazyDetailV544>>);
export const KERR_PHOTON_METROLOGY_LABELS_V544 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V543, "calibration-authority-gap": "Calibration authority gap" } satisfies Readonly<Record<IdV544, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V544 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V544) as IdV544[]);
