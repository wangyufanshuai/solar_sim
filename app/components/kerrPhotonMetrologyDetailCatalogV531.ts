"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV531 } from "../lib/kerrPhotonMetrologyObservatoryIntentV531";
import { KERR_PHOTON_METROLOGY_DETAILS_V530, KERR_PHOTON_METROLOGY_LABELS_V530 } from "./kerrPhotonMetrologyDetailCatalogV530";
type DetailIdV531 = Exclude<KerrPhotonMetrologyDetailSurfaceV531, "none">;
type LazyDetail = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V531 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V530, "regret-ranking": lazy(() => import("./KerrRegretRankingV531")) } satisfies Readonly<Record<DetailIdV531, LazyDetail>>);
export const KERR_PHOTON_METROLOGY_LABELS_V531 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V530, "regret-ranking": "Regret ranking" } satisfies Readonly<Record<DetailIdV531, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V531 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V531) as DetailIdV531[]);
