/**
 * Star cluster catalog — 40+ notable open and globular clusters.
 */

export type ClusterKind = "open" | "globular";

export type StarClusterDef = {
  id: string;
  catalogName: string;
  commonName: string;
  subtitleCn: string;
  kind: ClusterKind;
  /** Galactic longitude in degrees */
  galLonDeg: number;
  /** Galactic latitude in degrees */
  galLatDeg: number;
  /** Distance from Sun in parsecs */
  distancePc: number;
  /** Approximate angular size in arcminutes */
  sizeArcmin: number;
  /** Approximate visual magnitude */
  magV: number;
  color: string;
  intensity: number;
};

export const STAR_CLUSTERS: StarClusterDef[] = [
  // ── Open Clusters ────────────────────────────────────────
  { id: "m45", catalogName: "M45 / Mel 22", commonName: "Pleiades", subtitleCn: "昴星团", kind: "open", galLonDeg: 166.6, galLatDeg: -23.5, distancePc: 130, sizeArcmin: 110, magV: 1.6, color: "#aabbff", intensity: 1.0 },
  { id: "hyades", catalogName: "Mel 25", commonName: "Hyades", subtitleCn: "毕星团", kind: "open", galLonDeg: 181.5, galLatDeg: -22.3, distancePc: 47, sizeArcmin: 330, magV: 0.5, color: "#ddcc88", intensity: 0.90 },
  { id: "m44", catalogName: "M44 / NGC 2632", commonName: "Praesepe (Beehive)", subtitleCn: "蜂巢星团", kind: "open", galLonDeg: 206.0, galLatDeg: 32.5, distancePc: 187, sizeArcmin: 95, magV: 3.1, color: "#ccccdd", intensity: 0.80 },
  { id: "double_cl", catalogName: "NGC 869/884", commonName: "Double Cluster", subtitleCn: "双星团", kind: "open", galLonDeg: 134.6, galLatDeg: -3.4, distancePc: 2300, sizeArcmin: 30, magV: 3.7, color: "#bbccff", intensity: 0.78 },
  { id: "m6", catalogName: "M6 / NGC 6405", commonName: "Butterfly Cluster", subtitleCn: "蝴蝶星团", kind: "open", galLonDeg: 355.6, galLatDeg: 0.0, distancePc: 500, sizeArcmin: 25, magV: 4.2, color: "#ddbbaa", intensity: 0.65 },
  { id: "m7", catalogName: "M7 / NGC 6475", commonName: "Ptolemy Cluster", subtitleCn: "托勒密星团", kind: "open", galLonDeg: 354.0, galLatDeg: -3.3, distancePc: 300, sizeArcmin: 80, magV: 3.3, color: "#ddccaa", intensity: 0.72 },
  { id: "m35", catalogName: "M35 / NGC 2168", commonName: "M35", subtitleCn: "M35星团", kind: "open", galLonDeg: 192.4, galLatDeg: 2.2, distancePc: 850, sizeArcmin: 28, magV: 5.1, color: "#bbccdd", intensity: 0.62 },
  { id: "m37", catalogName: "M37 / NGC 2099", commonName: "M37", subtitleCn: "M37星团", kind: "open", galLonDeg: 195.0, galLatDeg: 0.5, distancePc: 1350, sizeArcmin: 24, magV: 6.2, color: "#ccbbaa", intensity: 0.55 },
  { id: "m38", catalogName: "M38 / NGC 1912", commonName: "M38", subtitleCn: "M38星团", kind: "open", galLonDeg: 191.5, galLatDeg: 0.9, distancePc: 1100, sizeArcmin: 21, magV: 7.4, color: "#ccccdd", intensity: 0.50 },
  { id: "m41", catalogName: "M41 / NGC 2287", commonName: "M41", subtitleCn: "M41星团", kind: "open", galLonDeg: 231.5, galLatDeg: -10.5, distancePc: 220, sizeArcmin: 38, magV: 4.5, color: "#ddccaa", intensity: 0.62 },
  { id: "m47", catalogName: "M47 / NGC 2422", commonName: "M47", subtitleCn: "M47星团", kind: "open", galLonDeg: 243.0, galLatDeg: -5.2, distancePc: 490, sizeArcmin: 30, magV: 4.4, color: "#bbddff", intensity: 0.60 },
  { id: "ic2602", catalogName: "IC 2602", commonName: "Theta Carinae Cluster", subtitleCn: "南昴星团", kind: "open", galLonDeg: 289.0, galLatDeg: -5.4, distancePc: 160, sizeArcmin: 60, magV: 1.9, color: "#aabbdd", intensity: 0.75 },
  { id: "ic2391", catalogName: "IC 2391", commonName: "Omicron Velorum Cluster", subtitleCn: "船帆座ο星团", kind: "open", galLonDeg: 270.0, galLatDeg: -6.9, distancePc: 150, sizeArcmin: 50, magV: 2.5, color: "#bbccdd", intensity: 0.70 },
  { id: "ngc6231", catalogName: "NGC 6231", commonName: "NGC 6231", subtitleCn: "NGC 6231星团", kind: "open", galLonDeg: 342.5, galLatDeg: 1.0, distancePc: 1600, sizeArcmin: 15, magV: 2.6, color: "#aaccff", intensity: 0.68 },
  { id: "hchi", catalogName: "NGC 869", commonName: "h Persei", subtitleCn: "英仙座h星团", kind: "open", galLonDeg: 134.0, galLatDeg: -3.3, distancePc: 2300, sizeArcmin: 15, magV: 3.8, color: "#bbccff", intensity: 0.72 },
  { id: "m52", catalogName: "M52 / NGC 7654", commonName: "M52", subtitleCn: "M52星团", kind: "open", galLonDeg: 107.5, galLatDeg: 0.4, distancePc: 1500, sizeArcmin: 13, magV: 6.9, color: "#bbbbdd", intensity: 0.52 },

  // ── Globular Clusters ────────────────────────────────────
  { id: "m13", catalogName: "M13 / NGC 6205", commonName: "Great Hercules Cluster", subtitleCn: "武仙座大球状星团", kind: "globular", galLonDeg: 59.0, galLatDeg: 40.9, distancePc: 7200, sizeArcmin: 20, magV: 5.8, color: "#ffdd88", intensity: 0.90 },
  { id: "omega_cen", catalogName: "NGC 5139", commonName: "Omega Centauri", subtitleCn: "半人马座ω星团", kind: "globular", galLonDeg: 309.1, galLatDeg: 14.97, distancePc: 5100, sizeArcmin: 36, magV: 3.7, color: "#ffcc77", intensity: 0.95 },
  { id: "47_tuc", catalogName: "NGC 104", commonName: "47 Tucanae", subtitleCn: "杜鹃座47", kind: "globular", galLonDeg: 305.9, galLatDeg: -44.89, distancePc: 4500, sizeArcmin: 31, magV: 4.1, color: "#ffcc66", intensity: 0.92 },
  { id: "m3", catalogName: "M3 / NGC 5272", commonName: "M3", subtitleCn: "M3球状星团", kind: "globular", galLonDeg: 42.2, galLatDeg: 78.7, distancePc: 10400, sizeArcmin: 18, magV: 6.2, color: "#eedd88", intensity: 0.78 },
  { id: "m5", catalogName: "M5 / NGC 5904", commonName: "M5", subtitleCn: "M5球状星团", kind: "globular", galLonDeg: 3.9, galLatDeg: 46.8, distancePc: 7800, sizeArcmin: 23, magV: 5.7, color: "#ffcc88", intensity: 0.80 },
  { id: "m15", catalogName: "M15 / NGC 7078", commonName: "M15", subtitleCn: "M15球状星团", kind: "globular", galLonDeg: 65.0, galLatDeg: -27.3, distancePc: 10000, sizeArcmin: 18, magV: 6.2, color: "#eedd77", intensity: 0.75 },
  { id: "m22", catalogName: "M22 / NGC 6656", commonName: "M22", subtitleCn: "M22球状星团", kind: "globular", galLonDeg: 9.9, galLatDeg: -7.6, distancePc: 3200, sizeArcmin: 32, magV: 5.1, color: "#ffcc88", intensity: 0.82 },
  { id: "m92", catalogName: "M92 / NGC 6341", commonName: "M92", subtitleCn: "M92球状星团", kind: "globular", galLonDeg: 68.3, galLatDeg: 35.2, distancePc: 8300, sizeArcmin: 14, magV: 6.4, color: "#ddcc77", intensity: 0.72 },
  { id: "m4", catalogName: "M4 / NGC 6121", commonName: "M4", subtitleCn: "M4球状星团", kind: "globular", galLonDeg: 351.0, galLatDeg: 15.9, distancePc: 2200, sizeArcmin: 26, magV: 5.6, color: "#ffbb77", intensity: 0.80 },
  { id: "m10", catalogName: "M10 / NGC 6254", commonName: "M10", subtitleCn: "M10球状星团", kind: "globular", galLonDeg: 15.1, galLatDeg: 23.1, distancePc: 5000, sizeArcmin: 20, magV: 6.6, color: "#eecc88", intensity: 0.70 },
  { id: "m12", catalogName: "M12 / NGC 6218", commonName: "M12", subtitleCn: "M12球状星团", kind: "globular", galLonDeg: 15.0, galLatDeg: 26.3, distancePc: 4800, sizeArcmin: 16, magV: 6.1, color: "#ddcc77", intensity: 0.68 },
  { id: "ngc6752", catalogName: "NGC 6752", commonName: "NGC 6752", subtitleCn: "NGC 6752星团", kind: "globular", galLonDeg: 336.1, galLatDeg: -25.6, distancePc: 4100, sizeArcmin: 20, magV: 5.4, color: "#ffcc88", intensity: 0.78 },
  { id: "ngc362", catalogName: "NGC 362", commonName: "NGC 362", subtitleCn: "NGC 362星团", kind: "globular", galLonDeg: 301.5, galLatDeg: -46.3, distancePc: 8600, sizeArcmin: 13, magV: 6.6, color: "#ddbb77", intensity: 0.62 },
  { id: "m28", catalogName: "M28 / NGC 6626", commonName: "M28", subtitleCn: "M28球状星团", kind: "globular", galLonDeg: 7.8, galLatDeg: -5.6, distancePc: 5700, sizeArcmin: 11, magV: 6.8, color: "#ddcc88", intensity: 0.62 },
  { id: "m55", catalogName: "M55 / NGC 6809", commonName: "M55", subtitleCn: "M55球状星团", kind: "globular", galLonDeg: 8.8, galLatDeg: -23.3, distancePc: 5400, sizeArcmin: 19, magV: 6.3, color: "#eecc88", intensity: 0.65 },
  { id: "m71", catalogName: "M71 / NGC 6838", commonName: "M71", subtitleCn: "M71球状星团", kind: "globular", galLonDeg: 56.9, galLatDeg: -4.6, distancePc: 4000, sizeArcmin: 7, magV: 6.1, color: "#ddbb88", intensity: 0.60 },
  { id: "m79", catalogName: "M79 / NGC 1904", commonName: "M79", subtitleCn: "M79球状星团", kind: "globular", galLonDeg: 227.2, galLatDeg: -29.4, distancePc: 12800, sizeArcmin: 9, magV: 8.0, color: "#ccbb77", intensity: 0.52 },
  { id: "terzan5", catalogName: "Terzan 5", commonName: "Terzan 5", subtitleCn: "Terzan 5星团", kind: "globular", galLonDeg: 3.8, galLatDeg: 1.7, distancePc: 5900, sizeArcmin: 1.0, magV: 12.0, color: "#ccaa66", intensity: 0.45 },
  { id: "m62", catalogName: "M62 / NGC 6266", commonName: "M62", subtitleCn: "M62球状星团", kind: "globular", galLonDeg: 353.6, galLatDeg: 7.3, distancePc: 6900, sizeArcmin: 15, magV: 6.5, color: "#ddbb77", intensity: 0.65 },
  { id: "m30", catalogName: "M30 / NGC 7099", commonName: "M30", subtitleCn: "M30球状星团", kind: "globular", galLonDeg: 27.2, galLatDeg: -46.8, distancePc: 8400, sizeArcmin: 12, magV: 7.2, color: "#ccbb88", intensity: 0.58 },
  { id: "m2", catalogName: "M2 / NGC 7089", commonName: "M2", subtitleCn: "M2球状星团", kind: "globular", galLonDeg: 53.4, galLatDeg: -35.8, distancePc: 11600, sizeArcmin: 16, magV: 6.3, color: "#ddcc88", intensity: 0.68 },
  { id: "m19", catalogName: "M19 / NGC 6273", commonName: "M19", subtitleCn: "M19球状星团", kind: "globular", galLonDeg: 357.0, galLatDeg: 9.4, distancePc: 8800, sizeArcmin: 14, magV: 6.8, color: "#ccbb77", intensity: 0.60 },
  { id: "ngc2808", catalogName: "NGC 2808", commonName: "NGC 2808", subtitleCn: "NGC 2808星团", kind: "globular", galLonDeg: 282.2, galLatDeg: -11.3, distancePc: 10000, sizeArcmin: 13, magV: 6.3, color: "#ddbb77", intensity: 0.62 },
  { id: "ngc2419", catalogName: "NGC 2419", commonName: "Intergalactic Wanderer", subtitleCn: "星系间漫游者", kind: "globular", galLonDeg: 180.4, galLatDeg: 25.2, distancePc: 85000, sizeArcmin: 4, magV: 10.4, color: "#bbaa66", intensity: 0.35 },
];
