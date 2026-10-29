"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV551 } from "../lib/kerrPhotonMetrologyObservatoryIntentV551";
import { KERR_PHOTON_METROLOGY_DETAILS_V550, KERR_PHOTON_METROLOGY_LABELS_V550 } from "./kerrPhotonMetrologyDetailCatalogV550";
type IdV551 = Exclude<KerrPhotonMetrologyDetailSurfaceV551, "none">; type LazyDetailV551 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V551 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V550, "license-confirmation": lazy(() => import("./KerrLicenseConfirmationV551")) } satisfies Readonly<Record<IdV551, LazyDetailV551>>);
export const KERR_PHOTON_METROLOGY_LABELS_V551 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V550, "license-confirmation": "License confirmation" } satisfies Readonly<Record<IdV551, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V551 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V551) as IdV551[]);
