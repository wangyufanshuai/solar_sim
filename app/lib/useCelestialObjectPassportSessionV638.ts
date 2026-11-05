"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { resolveMainlineAPassportCatalogId } from "../data/mainlineARegistryV607";
import { useAtlasRuntimeStore } from "./atlasRuntimeStore";
import { createCelestialObjectPassport } from "./celestialCatalog";
import type { CelestialObjectPassport } from "./simulationDiagnosticsTypes";

export type CelestialObjectPassportSessionV638 = Readonly<{
  passport: CelestialObjectPassport | null;
  isOpen: boolean;
  dismiss: () => void;
  reopen: () => void;
}>;

type PassportDismissal = Readonly<{
  selectedCatalogId: string;
  focusRequestId: number;
}>;

export function useCelestialObjectPassportSessionV638(
  selectedCatalogId: string,
  suppliedPassport: CelestialObjectPassport | null,
): CelestialObjectPassportSessionV638 {
  const focusRequestId = useAtlasRuntimeStore((snapshot) => (
    snapshot.focusCommand?.target.objectId === selectedCatalogId ? snapshot.focusRequestId : 0
  ));
  const passport = useMemo(() => {
    if (!selectedCatalogId) return null;
    const passportCatalogId = resolveMainlineAPassportCatalogId(selectedCatalogId);
    if (suppliedPassport && (
      suppliedPassport.objectId === selectedCatalogId || suppliedPassport.objectId === passportCatalogId
    )) return suppliedPassport;
    return createCelestialObjectPassport(passportCatalogId);
  }, [selectedCatalogId, suppliedPassport]);
  const [dismissal, setDismissal] = useState<PassportDismissal | null>(null);
  const currentSelectionDismissed = dismissal?.selectedCatalogId === selectedCatalogId
    && dismissal?.focusRequestId === focusRequestId;
  useEffect(() => {
    setDismissal((previous) => (
      previous?.selectedCatalogId === selectedCatalogId && previous?.focusRequestId === focusRequestId
        ? previous : null
    ));
  }, [focusRequestId, selectedCatalogId]);
  const dismiss = useCallback(() => {
    if (passport) setDismissal({ selectedCatalogId, focusRequestId });
  }, [focusRequestId, passport, selectedCatalogId]);
  const reopen = useCallback(() => {
    if (passport) setDismissal(null);
  }, [passport]);

  return {
    passport,
    isOpen: passport !== null && !currentSelectionDismissed,
    dismiss,
    reopen,
  };
}
