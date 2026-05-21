"use client";

import { useMemo, useState } from "react";
import {
  kerrOuterHorizonRadiusMeters,
  kerrStaticLimitRadiusMeters,
  schwarzschildRadiusMeters,
} from "../lib/kerrGeometry";
import { KERR_BLACK_HOLE_OFFSET_AU } from "./KerrBlackHole";

const SUN_MASS_KG = 1.98847e30;

export type KerrBlackHoleUiState = {
  massSolar: number;
  aOverM: number;
  frameDragTeachingScale: number;
};

type KerrBlackHolePanelProps = {
  value: KerrBlackHoleUiState;
  onChange: (next: KerrBlackHoleUiState) => void;
};

export default function KerrBlackHolePanel({
  value,
  onChange,
}: KerrBlackHolePanelProps) {
  const [open, setOpen] = useState(false);

  const mKg = value.massSolar * SUN_MASS_KG;
  const rgKm = useMemo(
    () => schwarzschildRadiusMeters(mKg) / 1000,
    [mKg]
  );
  const rPlusKm = useMemo(
    () => kerrOuterHorizonRadiusMeters(mKg, value.aOverM) / 1000,
    [mKg, value.aOverM]
  );
  /** Spin axis +Z; equator cosθ=0 → 外静态极限最大。 */
  const rSlEqKm = useMemo(
    () => kerrStaticLimitRadiusMeters(mKg, value.aOverM, 0) / 1000,
    [mKg, value.aOverM]
  );

  return (
    <div className="pointer-events-auto fixed bottom-[5.5rem] right-3 z-[86] w-[min(100vw,300px)] select-none rounded-lg border border-solid border-ui-strong bg-ui-glass px-3 py-2 text-xs text-ui-primary shadow-ui-panel backdrop-blur-ui">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left font-medium text-ui-primary"
      >
        <span>克尔黑洞（演示）</span>
        <span className="text-ui-dim">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-3 border-t border-ui pt-2">
          <p className="text-[11px] leading-relaxed text-ui-dim">
            固定于 ({KERR_BLACK_HOLE_OFFSET_AU[0]},{KERR_BLACK_HOLE_OFFSET_AU[1]},
            {KERR_BLACK_HOLE_OFFSET_AU[2]}) AU，不参与太阳系 N 体积分。能层外边界为静态极限；
            表面流动纹理为教学向示意（χ 小时几乎静止）。粒子为弱场 GEM 近似 + 教学放大。
          </p>
          <label className="block">
            <span className="text-ui-muted">
              质量 M（M☉）: {value.massSolar.toFixed(2)}
            </span>
            <input
              type="range"
              min={1}
              max={80}
              step={0.5}
              value={value.massSolar}
              onChange={(e) =>
                onChange({
                  ...value,
                  massSolar: Number(e.target.value),
                })
              }
              className="mt-1 w-full accent-neutral-500"
            />
          </label>
          <label className="block">
            <span className="text-ui-muted">
              自旋 a/M: {value.aOverM.toFixed(3)}
            </span>
            <input
              type="range"
              min={0}
              max={0.998}
              step={0.002}
              value={value.aOverM}
              onChange={(e) =>
                onChange({
                  ...value,
                  aOverM: Number(e.target.value),
                })
              }
              className="mt-1 w-full accent-neutral-500"
            />
          </label>
          <label className="block">
            <span className="text-ui-muted">
              参考系拖曳放大（粒子）:{" "}
              {value.frameDragTeachingScale >= 1e9
                ? `${(value.frameDragTeachingScale / 1e9).toFixed(2)}×10⁹`
                : value.frameDragTeachingScale.toExponential(1)}
            </span>
            <input
              type="range"
              min={5}
              max={15}
              step={0.08}
              value={Math.min(
                15,
                Math.max(5, Math.log10(Math.max(1, value.frameDragTeachingScale)))
              )}
              onChange={(e) =>
                onChange({
                  ...value,
                  frameDragTeachingScale: Math.pow(10, Number(e.target.value)),
                })
              }
              className="mt-1 w-full accent-neutral-500"
            />
          </label>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-ui-muted">
            <dt>r_g</dt>
            <dd className="text-right text-ui-primary">{rgKm.toFixed(3)} km</dd>
            <dt>r₊（外视界）</dt>
            <dd className="text-right text-ui-primary">{rPlusKm.toFixed(3)} km</dd>
            <dt>静态极限（赤道）</dt>
            <dd className="text-right text-ui-primary">{rSlEqKm.toFixed(3)} km</dd>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
