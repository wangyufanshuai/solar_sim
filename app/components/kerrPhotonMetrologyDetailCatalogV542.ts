"use client";

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV542 } from "../lib/kerrPhotonMetrologyObservatoryIntentV542";
import { KERR_PHOTON_METROLOGY_DETAILS_V541, KERR_PHOTON_METROLOGY_LABELS_V541 } from "./kerrPhotonMetrologyDetailCatalogV541";

type IdV542 = Exclude<KerrPhotonMetrologyDetailSurfaceV542, "none">;
type LazyDetailV542 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V542 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V541, "replay-compatibility": lazy(() => import("./KerrReplayCompatibilityV542")) } satisfies Readonly<Record<IdV542, LazyDetailV542>>);
export const KERR_PHOTON_METROLOGY_LABELS_V542 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V541, "replay-compatibility": "Replay compatibility" } satisfies Readonly<Record<IdV542, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V542 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V542) as IdV542[]);
