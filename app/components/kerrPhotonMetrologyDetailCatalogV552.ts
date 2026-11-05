"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV552 } from "../lib/kerrPhotonMetrologyObservatoryIntentV552";
import { KERR_PHOTON_METROLOGY_DETAILS_V551, KERR_PHOTON_METROLOGY_LABELS_V551 } from "./kerrPhotonMetrologyDetailCatalogV551";

type IdV552 = Exclude<KerrPhotonMetrologyDetailSurfaceV552, "none">;
type LazyDetailV552 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V552 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_DETAILS_V551,
  "license-confirmation-packet": lazy(() => import("./KerrLicenseConfirmationV552")),
} satisfies Readonly<Record<IdV552, LazyDetailV552>>);
export const KERR_PHOTON_METROLOGY_LABELS_V552 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_LABELS_V551,
  "license-confirmation-packet": "License confirmation packet",
} satisfies Readonly<Record<IdV552, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V552 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V552) as IdV552[]);
