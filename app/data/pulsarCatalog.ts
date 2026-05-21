/**
 * Pulsar catalog — 25 notable pulsars and neutron stars.
 * Data from ATNF Pulsar Catalogue.
 */

export type PulsarDef = {
  id: string;
  /** PSR J designation */
  name: string;
  /** Common name if any */
  commonName: string;
  /** Chinese subtitle */
  subtitleCn: string;
  /** Galactic longitude in degrees */
  galLonDeg: number;
  /** Galactic latitude in degrees */
  galLatDeg: number;
  /** Distance in parsecs */
  distancePc: number;
  /** Pulse period in seconds */
  periodS: number;
  /** Visual color for rendering */
  color: string;
  /** Relative intensity */
  intensity: number;
};

export const PULSARS: PulsarDef[] = [
  // ── Famous/Historical Pulsars ────────────────────────────
  { id: "b0531+21", name: "PSR B0531+21", commonName: "Crab Pulsar", subtitleCn: "蟹状星云脉冲星", galLonDeg: 184.6, galLatDeg: -5.8, distancePc: 650, periodS: 0.0335, color: "#00ffaa", intensity: 1.0 },
  { id: "b0833-45", name: "PSR B0833-45", commonName: "Vela Pulsar", subtitleCn: "船帆座脉冲星", galLonDeg: 263.6, galLatDeg: -2.8, distancePc: 287, periodS: 0.0894, color: "#00eeff", intensity: 0.95 },
  { id: "b1919+21", name: "PSR B1919+21", commonName: "First Pulsar (LGM-1)", subtitleCn: "第一颗脉冲星", galLonDeg: 56.8, galLatDeg: -1.7, distancePc: 330, periodS: 1.337, color: "#44ffcc", intensity: 0.70 },
  { id: "b0329+54", name: "PSR B0329+54", commonName: "PSR B0329+54", subtitleCn: "最强射电脉冲星", galLonDeg: 145.0, galLatDeg: -1.2, distancePc: 1030, periodS: 0.7145, color: "#22ffdd", intensity: 0.75 },

  // ── Millisecond Pulsars ──────────────────────────────────
  { id: "j0437-4715", name: "PSR J0437-4715", commonName: "Nearest MSP", subtitleCn: "最近毫秒脉冲星", galLonDeg: 253.4, galLatDeg: -42.0, distancePc: 157, periodS: 0.00576, color: "#66ffee", intensity: 0.85 },
  { id: "b1937+21", name: "PSR B1937+21", commonName: "First MSP", subtitleCn: "第一颗毫秒脉冲星", galLonDeg: 57.5, galLatDeg: -2.1, distancePc: 3600, periodS: 0.00156, color: "#88ffff", intensity: 0.70 },
  { id: "j0030+0451", name: "PSR J0030+0451", commonName: "PSR J0030", subtitleCn: "J0030脉冲星", galLonDeg: 112.3, galLatDeg: -56.7, distancePc: 210, periodS: 0.00487, color: "#77ffdd", intensity: 0.65 },
  { id: "j1824-2452a", name: "PSR J1824-2452A", commonName: "M28 Pulsar", subtitleCn: "M28脉冲星", galLonDeg: 7.8, galLatDeg: -5.6, distancePc: 5700, periodS: 0.00305, color: "#66ffcc", intensity: 0.60 },

  // ── Magnetars ────────────────────────────────────────────
  { id: "sgr1806-20", name: "SGR 1806-20", commonName: "SGR 1806-20", subtitleCn: "SGR 1806-20磁星", galLonDeg: 10.1, galLatDeg: -0.3, distancePc: 4500, periodS: 7.56, color: "#ff44aa", intensity: 0.88 },
  { id: "sgr1900+14", name: "SGR 1900+14", commonName: "SGR 1900+14", subtitleCn: "SGR 1900+14磁星", galLonDeg: 42.6, galLatDeg: 0.8, distancePc: 5000, periodS: 5.16, color: "#ff66bb", intensity: 0.82 },
  { id: "1e2259+586", name: "1E 2259+586", commonName: "1E 2259+586 (AXP)", subtitleCn: "1E 2259+586磁星", galLonDeg: 109.1, galLatDeg: -0.4, distancePc: 3900, periodS: 6.98, color: "#ff55aa", intensity: 0.75 },
  { id: "4u0142+61", name: "4U 0142+61", commonName: "4U 0142+61 (AXP)", subtitleCn: "4U 0142+61磁星", galLonDeg: 128.8, galLatDeg: -1.4, distancePc: 4200, periodS: 8.69, color: "#ff44bb", intensity: 0.72 },
  { id: "cxou_j1647", name: "CXOU J164710.2-455216", commonName: "CXOU J1647", subtitleCn: "CXOU J1647磁星", galLonDeg: 340.0, galLatDeg: 0.2, distancePc: 4300, periodS: 10.6, color: "#ff66aa", intensity: 0.68 },

  // ── Binary / X-ray Pulsars ──────────────────────────────
  { id: "b1913+16", name: "PSR B1913+16", commonName: "Hulse-Taylor Binary", subtitleCn: "赫尔斯-泰勒双脉冲星", galLonDeg: 49.8, galLatDeg: 2.1, distancePc: 5900, periodS: 0.0590, color: "#44ddff", intensity: 0.80 },
  { id: "j0737-3039a", name: "PSR J0737-3039A", commonName: "Double Pulsar", subtitleCn: "双脉冲星", galLonDeg: 245.3, galLatDeg: -1.6, distancePc: 1500, periodS: 0.0227, color: "#55eeff", intensity: 0.82 },
  { id: "cen_x3", name: "Cen X-3", commonName: "Cen X-3", subtitleCn: "半人马座X-3", galLonDeg: 292.1, galLatDeg: 0.3, distancePc: 8100, periodS: 4.84, color: "#ff88cc", intensity: 0.72 },
  { id: "her_x1", name: "Her X-1", commonName: "Her X-1", subtitleCn: "武仙座X-1", galLonDeg: 58.0, galLatDeg: 24.3, distancePc: 6500, periodS: 1.24, color: "#dd88ff", intensity: 0.68 },
  { id: "vel_x1", name: "Vela X-1", commonName: "Vela X-1", subtitleCn: "船帆座X-1", galLonDeg: 263.0, galLatDeg: 3.9, distancePc: 1900, periodS: 283.0, color: "#cc77ee", intensity: 0.65 },

  // ── Notable Regular Pulsars ──────────────────────────────
  { id: "b0540-69", name: "PSR B0540-69", commonName: "B0540-69 (LMC)", subtitleCn: "大麦哲伦脉冲星", galLonDeg: 279.6, galLatDeg: -31.3, distancePc: 50000, periodS: 0.0505, color: "#44ffdd", intensity: 0.65 },
  { id: "b1509-58", name: "PSR B1509-58", commonName: "B1509-58", subtitleCn: "B1509-58脉冲星", galLonDeg: 320.3, galLatDeg: -1.2, distancePc: 4100, periodS: 0.1507, color: "#55ffcc", intensity: 0.70 },
  { id: "j0534+2200", name: "PSR J0534+2200", commonName: "Crab Pulsar (J)", subtitleCn: "蟹状星云脉冲星J", galLonDeg: 184.6, galLatDeg: -5.8, distancePc: 650, periodS: 0.0335, color: "#00ffbb", intensity: 0.90 },
  { id: "geminga", name: "PSR J0633+1746", commonName: "Geminga", subtitleCn: "双子座γ射线源", galLonDeg: 195.1, galLatDeg: -4.3, distancePc: 190, periodS: 0.2371, color: "#88ffcc", intensity: 0.75 },
  { id: "b0823+26", name: "PSR B0823+26", commonName: "B0823+26", subtitleCn: "B0823+26脉冲星", galLonDeg: 199.4, galLatDeg: 31.7, distancePc: 310, periodS: 0.5307, color: "#44eedd", intensity: 0.55 },
  { id: "b0950+08", name: "PSR B0950+08", commonName: "B0950+08", subtitleCn: "B0950+08脉冲星", galLonDeg: 228.9, galLatDeg: 43.7, distancePc: 260, periodS: 0.2531, color: "#55ddcc", intensity: 0.55 },
];
