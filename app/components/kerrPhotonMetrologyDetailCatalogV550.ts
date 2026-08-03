"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV550 } from "../lib/kerrPhotonMetrologyObservatoryIntentV550";
import { KERR_PHOTON_METROLOGY_DETAILS_V549, KERR_PHOTON_METROLOGY_LABELS_V549 } from "./kerrPhotonMetrologyDetailCatalogV549";
type IdV550 = Exclude<KerrPhotonMetrologyDetailSurfaceV550, "none">; type LazyDetailV550 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V550 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V549, "measured-pack-manifest": lazy(() => import("./KerrMeasuredPackManifestV550")) } satisfies Readonly<Record<IdV550, LazyDetailV550>>);
export const KERR_PHOTON_METROLOGY_LABELS_V550 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V549, "measured-pack-manifest": "Measured pack manifest" } satisfies Readonly<Record<IdV550, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V550 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V550) as IdV550[]);
