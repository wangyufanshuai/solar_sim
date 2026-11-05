export type SkyCoordinateV607 = { raDeg: number; decDeg: number };
export type ChartPointV607 = { x: number; y: number };
const radians = Math.PI / 180;

/** Stereographic sky projection. North is up and east (increasing RA) is left.
 * Trigonometric RA differences handle the 0/360 seam and high declinations. */
export function projectSkyCoordinateV607(point: SkyCoordinateV607, center: SkyCoordinateV607): ChartPointV607 {
  const delta = (point.raDeg - center.raDeg) * radians;
  const dec = point.decDeg * radians;
  const dec0 = center.decDeg * radians;
  const denominator = 1 + Math.sin(dec0) * Math.sin(dec) + Math.cos(dec0) * Math.cos(dec) * Math.cos(delta);
  if (denominator < 1e-6) throw new Error("Sky chart cannot project its antipode");
  return {
    x: -2 * Math.cos(dec) * Math.sin(delta) / denominator,
    y: -2 * (Math.cos(dec0) * Math.sin(dec) - Math.sin(dec0) * Math.cos(dec) * Math.cos(delta)) / denominator,
  };
}

export function fitSkyChartV607(points: readonly SkyCoordinateV607[], width = 360, height = 260, padding = 30) {
  if (!points.length) throw new Error("Sky chart requires coordinates");
  const vector = points.reduce((sum, point) => [
    sum[0] + Math.cos(point.decDeg * radians) * Math.cos(point.raDeg * radians),
    sum[1] + Math.cos(point.decDeg * radians) * Math.sin(point.raDeg * radians),
    sum[2] + Math.sin(point.decDeg * radians),
  ], [0, 0, 0]);
  const center = { raDeg: Math.atan2(vector[1], vector[0]) / radians, decDeg: Math.atan2(vector[2], Math.hypot(vector[0], vector[1])) / radians };
  const projected = points.map((point) => projectSkyCoordinateV607(point, center));
  const minX = Math.min(...projected.map((point) => point.x));
  const maxX = Math.max(...projected.map((point) => point.x));
  const minY = Math.min(...projected.map((point) => point.y));
  const maxY = Math.max(...projected.map((point) => point.y));
  const scale = Math.min((width - 2 * padding) / Math.max(maxX - minX, 1e-6), (height - 2 * padding) / Math.max(maxY - minY, 1e-6));
  return {
    center,
    project: (point: SkyCoordinateV607): ChartPointV607 => {
      const projected = projectSkyCoordinateV607(point, center);
      return { x: width / 2 + (projected.x - (minX + maxX) / 2) * scale, y: height / 2 + (projected.y - (minY + maxY) / 2) * scale };
    },
  };
}
