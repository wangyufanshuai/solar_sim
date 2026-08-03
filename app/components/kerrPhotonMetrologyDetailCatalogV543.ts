"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV543 } from "../lib/kerrPhotonMetrologyObservatoryIntentV543";
import { KERR_PHOTON_METROLOGY_DETAILS_V542, KERR_PHOTON_METROLOGY_LABELS_V542 } from "./kerrPhotonMetrologyDetailCatalogV542";
type IdV543 = Exclude<KerrPhotonMetrologyDetailSurfaceV543, "none">; type LazyDetailV543 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V543 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V542, "isolated-replay-preflight": lazy(() => import("./KerrReplayIsolatedPreflightV543")) } satisfies Readonly<Record<IdV543, LazyDetailV543>>);
export const KERR_PHOTON_METROLOGY_LABELS_V543 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V542, "isolated-replay-preflight": "Isolated replay preflight" } satisfies Readonly<Record<IdV543, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V543 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V543) as IdV543[]);
