"use client";

import { memo, useMemo } from "react";
import type { GaiaAstrometricCovarianceV1 } from "../lib/gaiaScienceV8";
import type { GaiaResearchPayloadV271 } from "../lib/gaiaResearchWorkbenchV271";

const COLOR_BUCKETS = 16;

function palette(bucket: number, mode: "density" | "selection") {
  const t = bucket / (COLOR_BUCKETS - 1);
  return mode === "selection"
    ? `hsl(${190 - t * 150} 72% ${18 + t * 48}%)`
    : `hsl(${205 - t * 28} 72% ${10 + t * 62}%)`;
}

function bucket(value: number, maximum: number): number {
  const normalized = maximum > 0 ? Math.max(0, Math.min(1, value / maximum)) : 0;
  return Math.min(COLOR_BUCKETS - 1, Math.floor(normalized * COLOR_BUCKETS));
}

function mollweide(raDeg: number, decDeg: number): readonly [number, number] {
  const longitude = (((raDeg + 180) % 360) - 180) * Math.PI / 180;
  const latitude = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, decDeg * Math.PI / 180));
  let theta = latitude;
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const numerator = 2 * theta + Math.sin(2 * theta) - Math.PI * Math.sin(latitude);
    const denominator = 2 + 2 * Math.cos(2 * theta);
    if (Math.abs(denominator) < 1e-10) break;
    theta -= numerator / denominator;
  }
  const x = 2 * Math.SQRT2 / Math.PI * longitude * Math.cos(theta);
  const y = Math.SQRT2 * Math.sin(theta);
  return [180 - x / (2 * Math.SQRT2) * 170, 90 - y / Math.SQRT2 * 80];
}

function GaiaResearchDensityViewsV267({ payload }: { payload: GaiaResearchPayloadV271 }) {
  if (payload.kind === "overview") return null;
  if (payload.kind === "hr-density") return <HrDensity payload={payload} />;
  return <SkyDensity payload={payload} />;
}

function HrDensity({ payload }: { payload: Extract<GaiaResearchPayloadV271, { kind: "hr-density" }> }) {
  const maximum = Math.max(1, ...payload.cells.map((cell) => Math.log1p(cell.count)));
  const paths = useMemo(() => {
    const groups = Array.from({ length: COLOR_BUCKETS }, () => "");
    for (const cell of payload.cells) {
      const group = bucket(Math.log1p(cell.count), maximum);
      const y = payload.bins - 1 - cell.y;
      groups[group] += `M${cell.x} ${y}h1.04v1.04h-1.04Z`;
    }
    return groups;
  }, [maximum, payload.bins, payload.cells]);
  return (
    <figure className="rounded-xl border border-white/8 bg-black/25 p-3" data-atlas-gaia-density-view="hr-cmd-svg">
      <figcaption className="mb-2 flex justify-between text-[9px] uppercase tracking-[0.12em] text-slate-500">
        <span>HR / CMD density</span><span>raw G, no extinction correction</span>
      </figcaption>
      <svg viewBox={`-10 -6 ${payload.bins + 20} ${payload.bins + 16}`} className="aspect-square w-full rounded-lg bg-[#020608]" role="img" aria-label="Gaia HR CMD 密度图">
        {paths.map((path, index) => path ? <path key={index} d={path} fill={palette(index, "density")} /> : null)}
        <path d={`M0 ${payload.bins}V0M0 ${payload.bins}H${payload.bins}`} fill="none" stroke="rgba(160,210,220,.35)" strokeWidth=".35" />
        <text x={payload.bins / 2} y={payload.bins + 8} textAnchor="middle" fontSize="3.4" fill="rgba(180,205,215,.7)">BP−RP (mag)</text>
        <text x="-7" y={payload.bins / 2} textAnchor="middle" fontSize="3.4" fill="rgba(180,205,215,.7)" transform={`rotate(-90 -7 ${payload.bins / 2})`}>M_G (mag)</text>
      </svg>
      <div className="mt-2 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg,${palette(0, "density")},${palette(15, "density")})` }} aria-label="log count color scale" />
      <p className="mt-2 text-[9px] text-slate-600">log(1 + count) · underflow {payload.underflowCount.toLocaleString()} · overflow {payload.overflowCount.toLocaleString()}</p>
    </figure>
  );
}

function SkyDensity({ payload }: { payload: Extract<GaiaResearchPayloadV271, { kind: "healpix-density" | "selection" }> }) {
  const mode = payload.kind === "selection" ? "selection" : "density";
  const values = payload.kind === "selection"
    ? payload.cells.map((cell) => cell.inclusionFraction ?? 0)
    : payload.cells.map((cell) => Math.log1p(cell.count));
  const maximum = Math.max(1e-12, ...values);
  const paths = useMemo(() => {
    const groups = Array.from({ length: COLOR_BUCKETS }, () => "");
    const size = payload.order === 3 ? 2.5 : 0.72;
    payload.cells.forEach((cell, index) => {
      const [x, y] = mollweide(cell.raDeg, cell.decDeg);
      const group = bucket(values[index] ?? 0, maximum);
      groups[group] += `M${(x - size / 2).toFixed(2)} ${(y - size / 2).toFixed(2)}h${size}v${size}h-${size}Z`;
    });
    return groups;
  }, [maximum, payload.cells, payload.order, values]);
  return (
    <figure className="rounded-xl border border-white/8 bg-black/25 p-3" data-atlas-gaia-density-view={`${payload.kind}-mollweide-svg`}>
      <figcaption className="mb-2 flex justify-between text-[9px] uppercase tracking-[0.12em] text-slate-500">
        <span>{payload.kind === "selection" ? "Subset inclusion" : "HEALPix density"}</span>
        <span>NESTED order {payload.order} · Mollweide</span>
      </figcaption>
      <svg viewBox="0 0 360 180" className="w-full rounded-lg bg-[#020608]" role="img" aria-label={payload.kind === "selection" ? "Atlas 子集包含比例全天图" : "Gaia HEALPix 全天密度图"}>
        <ellipse cx="180" cy="90" rx="170" ry="80" fill="none" stroke="rgba(160,210,220,.18)" />
        <path d="M10 90H350M180 10V170" stroke="rgba(160,210,220,.1)" strokeWidth=".5" />
        {paths.map((path, index) => path ? <path key={index} d={path} fill={palette(index, mode)} /> : null)}
        <text x="12" y="176" fontSize="7" fill="rgba(180,205,215,.45)">RA increases leftward · ICRS</text>
      </svg>
      <div className="mt-2 h-1.5 rounded-full" style={{ background: `linear-gradient(90deg,${palette(0, mode)},${palette(15, mode)})` }} />
      <p className="mt-2 text-[9px] text-slate-600">
        {payload.kind === "selection"
          ? `${payload.population}; numerator uses quality/RUWE filters, denominator uses G/BP−RP only.`
          : payload.densityBasis === "all-frozen-science-rows" ? "All 200,000 frozen rows." : "Canonical G/BP−RP selection domain."}
      </p>
    </figure>
  );
}

export const GaiaUncertaintyEllipseV267 = memo(function GaiaUncertaintyEllipseV267({ covariance }: { covariance: GaiaAstrometricCovarianceV1 }) {
  const ellipse = useMemo(() => {
    const a = covariance.matrix[0]?.[0] ?? 0;
    const b = covariance.matrix[0]?.[1] ?? 0;
    const d = covariance.matrix[1]?.[1] ?? 0;
    const trace = a + d;
    const root = Math.sqrt(Math.max(0, (a - d) ** 2 + 4 * b ** 2));
    const major = Math.sqrt(Math.max(0, (trace + root) / 2));
    const minor = Math.sqrt(Math.max(0, (trace - root) / 2));
    const angle = Math.atan2(2 * b, a - d) * 90 / Math.PI;
    const scale = 70 / Math.max(major, 1e-12);
    return { rx: major * scale, ry: minor * scale, angle };
  }, [covariance]);
  return (
    <figure className="rounded-xl border border-cyan-200/10 bg-[#02080b] p-3">
      <figcaption className="text-[9px] uppercase tracking-[0.14em] text-cyan-200/50">RA / Dec 1σ covariance ellipse</figcaption>
      <svg viewBox="0 0 200 140" className="mt-2 w-full" role="img" aria-label="Gaia 赤经赤纬协方差椭圆">
        <path d="M20 70H180M100 10V130" stroke="rgba(114,196,212,.16)" strokeWidth="1" />
        <ellipse cx="100" cy="70" rx={ellipse.rx} ry={ellipse.ry} transform={`rotate(${ellipse.angle} 100 70)`} fill="rgba(114,196,212,.08)" stroke="#72c4d4" strokeWidth="1.5" />
      </svg>
    </figure>
  );
});

export default memo(GaiaResearchDensityViewsV267);
