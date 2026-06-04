"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { RenderAssetQueue, type RenderBudget } from "../lib/renderAssetQueue";

const RenderAssetQueueContext = createContext<RenderAssetQueue | null>(null);

export function RenderAssetQueueProvider({
  budget,
  children,
}: {
  budget: RenderBudget;
  children: ReactNode;
}) {
  const queueRef = useRef<RenderAssetQueue | null>(null);
  if (!queueRef.current) queueRef.current = new RenderAssetQueue(budget);

  useEffect(() => {
    queueRef.current?.setBudget(budget);
  }, [budget]);

  return (
    <RenderAssetQueueContext.Provider value={queueRef.current}>
      {children}
    </RenderAssetQueueContext.Provider>
  );
}

export function useOptionalRenderAssetQueue() {
  return useContext(RenderAssetQueueContext);
}
