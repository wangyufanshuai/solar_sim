"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV553 } from "../lib/kerrPhotonMetrologyObservatoryIntentV553";
import { KERR_PHOTON_METROLOGY_DETAILS_V552, KERR_PHOTON_METROLOGY_LABELS_V552 } from "./kerrPhotonMetrologyDetailCatalogV552";
type IdV553 = Exclude<KerrPhotonMetrologyDetailSurfaceV553, "none">; type LazyDetailV553 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V553 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V552, "observation-authority-join": lazy(() => import("./KerrObservationAuthorityJoinV553")) } satisfies Readonly<Record<IdV553, LazyDetailV553>>);
export const KERR_PHOTON_METROLOGY_LABELS_V553 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V552, "observation-authority-join": "Observation authority join" } satisfies Readonly<Record<IdV553, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V553 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V553) as IdV553[]);
