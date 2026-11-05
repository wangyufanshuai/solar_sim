"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";

import type { KerrPhotonMetrologyDetailSurfaceV537 } from "../lib/kerrPhotonMetrologyObservatoryIntentV537";
import { KERR_PHOTON_METROLOGY_DETAILS_V536, KERR_PHOTON_METROLOGY_LABELS_V536 } from "./kerrPhotonMetrologyDetailCatalogV536";

type IdV537 = Exclude<KerrPhotonMetrologyDetailSurfaceV537, "none">;
type LazyDetailV537 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V537 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_DETAILS_V536,
  "response-aware-sparse-fits": lazy(() => import("./KerrResponseAwareSparseFitsV537")),
} satisfies Readonly<Record<IdV537, LazyDetailV537>>);
export const KERR_PHOTON_METROLOGY_LABELS_V537 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_LABELS_V536,
  "response-aware-sparse-fits": "FITS sparse table",
} satisfies Readonly<Record<IdV537, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V537 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V537) as IdV537[]);
