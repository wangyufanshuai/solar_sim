"use client";
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { KerrPhotonMetrologyDetailSurfaceV557 } from "../lib/kerrPhotonMetrologyObservatoryIntentV557";
import { KERR_PHOTON_METROLOGY_DETAILS_V556, KERR_PHOTON_METROLOGY_LABELS_V556 } from "./kerrPhotonMetrologyDetailCatalogV556";
type IdV557 = Exclude<KerrPhotonMetrologyDetailSurfaceV557, "none">; type LazyDetailV557 = LazyExoticComponent<ComponentType<Record<string, never>>>;
export const KERR_PHOTON_METROLOGY_DETAILS_V557 = Object.freeze({ ...KERR_PHOTON_METROLOGY_DETAILS_V556, "sparse-coordinate-products": lazy(() => import("./KerrSparseCoordinateProductsV557")) } satisfies Readonly<Record<IdV557, LazyDetailV557>>);
export const KERR_PHOTON_METROLOGY_LABELS_V557 = Object.freeze({ ...KERR_PHOTON_METROLOGY_LABELS_V556, "sparse-coordinate-products": "Screen coordinate provenance" } satisfies Readonly<Record<IdV557, string>>);
export const KERR_PHOTON_METROLOGY_DETAIL_IDS_V557 = Object.freeze(Object.keys(KERR_PHOTON_METROLOGY_DETAILS_V557) as IdV557[]);
