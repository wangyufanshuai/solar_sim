"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV534 } from "../lib/kerrPhotonMetrologyObservatoryIntentV534";
import {
  KERR_PHOTON_METROLOGY_DETAILS_V533,
  KERR_PHOTON_METROLOGY_LABELS_V533,
} from "./kerrPhotonMetrologyDetailCatalogV533";

type Id = Exclude<KerrPhotonMetrologyDetailSurfaceV534, "none">;
type LazyDetail = LazyExoticComponent<ComponentType<Record<string, never>>>;

export const KERR_PHOTON_METROLOGY_DETAILS_V534 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_DETAILS_V533,
  "bandpass-redshift": lazy(() => import("./KerrBandpassRedshiftCommutatorV534")),
} satisfies Readonly<Record<Id, LazyDetail>>);

export const KERR_PHOTON_METROLOGY_LABELS_V534 = Object.freeze({
  ...KERR_PHOTON_METROLOGY_LABELS_V533,
  "bandpass-redshift": "Bandpass × redshift",
} satisfies Readonly<Record<Id, string>>);

export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V534 = Object.freeze(
  Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V534) as Id[],
);
