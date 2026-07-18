/**
 * Nebula catalog — 50+ notable galactic nebulae.
 * Positions in galactic coordinates (longitude, latitude) with distance in parsecs.
 */

export type NebulaKind = "emission" | "reflection" | "dark" | "planetary" | "supernova-remnant";

export type NebulaDef = {
  id: string;
  catalogName: string;
  commonName: string;
  subtitleCn: string;
  kind: NebulaKind;
  galLonDeg: number;
  galLatDeg: number;
  distancePc: number;
  sizeArcmin: number;
  color: string;
  intensity: number;
};

export const NEBULAE: NebulaDef[] = [
  // ── Emission Nebulae ──────────────────────────────────────
  { id: "m42", catalogName: "M42 / NGC 1976", commonName: "Orion Nebula", subtitleCn: "猎户座大星云", kind: "emission", galLonDeg: 209.0, galLatDeg: -19.4, distancePc: 412, sizeArcmin: 85, color: "#ff6b8a", intensity: 1.0 },
  { id: "m16", catalogName: "M16 / NGC 6611", commonName: "Eagle Nebula", subtitleCn: "鹰状星云", kind: "emission", galLonDeg: 17.0, galLatDeg: 0.8, distancePc: 1750, sizeArcmin: 35, color: "#ff5c7a", intensity: 0.85 },
  { id: "m17", catalogName: "M17 / NGC 6618", commonName: "Omega Nebula", subtitleCn: "Ω星云", kind: "emission", galLonDeg: 15.0, galLatDeg: -0.7, distancePc: 1600, sizeArcmin: 46, color: "#ff7a8e", intensity: 0.82 },
  { id: "m8", catalogName: "M8 / NGC 6523", commonName: "Lagoon Nebula", subtitleCn: "礁湖星云", kind: "emission", galLonDeg: 6.0, galLatDeg: -1.3, distancePc: 1250, sizeArcmin: 90, color: "#ff8ca0", intensity: 0.88 },
  { id: "m20", catalogName: "M20 / NGC 6514", commonName: "Trifid Nebula", subtitleCn: "三叶星云", kind: "emission", galLonDeg: 7.0, galLatDeg: -2.4, distancePc: 1300, sizeArcmin: 28, color: "#ff5577", intensity: 0.78 },
  { id: "ic434", catalogName: "IC 434", commonName: "Horsehead Nebula", subtitleCn: "马头星云", kind: "emission", galLonDeg: 206.8, galLatDeg: -16.5, distancePc: 412, sizeArcmin: 8, color: "#ff4466", intensity: 0.65 },
  { id: "ngc7000", catalogName: "NGC 7000", commonName: "North America Nebula", subtitleCn: "北美洲星云", kind: "emission", galLonDeg: 85.0, galLatDeg: -1.0, distancePc: 800, sizeArcmin: 120, color: "#ff6b8a", intensity: 0.75 },
  { id: "ic1396", catalogName: "IC 1396", commonName: "Elephant's Trunk Nebula", subtitleCn: "象鼻星云", kind: "emission", galLonDeg: 99.0, galLatDeg: 3.8, distancePc: 800, sizeArcmin: 170, color: "#ff7788", intensity: 0.65 },
  { id: "ngc281", catalogName: "NGC 281", commonName: "Pacman Nebula", subtitleCn: "吃豆人星云", kind: "emission", galLonDeg: 123.9, galLatDeg: -6.3, distancePc: 2800, sizeArcmin: 35, color: "#ff8899", intensity: 0.60 },
  { id: "ngc2237", catalogName: "NGC 2237", commonName: "Rosette Nebula", subtitleCn: "玫瑰星云", kind: "emission", galLonDeg: 206.3, galLatDeg: -2.1, distancePc: 1600, sizeArcmin: 80, color: "#ff5577", intensity: 0.80 },
  { id: "ngc3603", catalogName: "NGC 3603", commonName: "NGC 3603", subtitleCn: "NGC 3603星云", kind: "emission", galLonDeg: 291.6, galLatDeg: -0.5, distancePc: 6900, sizeArcmin: 10, color: "#ff6688", intensity: 0.55 },
  { id: "m43", catalogName: "M43 / NGC 1982", commonName: "De Mairan's Nebula", subtitleCn: "德迈兰星云", kind: "emission", galLonDeg: 208.8, galLatDeg: -19.3, distancePc: 412, sizeArcmin: 20, color: "#ff7788", intensity: 0.70 },
  { id: "ngc2024", catalogName: "NGC 2024", commonName: "Flame Nebula", subtitleCn: "火焰星云", kind: "emission", galLonDeg: 206.5, galLatDeg: -16.5, distancePc: 412, sizeArcmin: 30, color: "#ff8866", intensity: 0.70 },
  { id: "ic1848", catalogName: "IC 1848", commonName: "Soul Nebula", subtitleCn: "灵魂星云", kind: "emission", galLonDeg: 135.0, galLatDeg: 0.9, distancePc: 2400, sizeArcmin: 60, color: "#ff6688", intensity: 0.70 },
  { id: "ic1805", catalogName: "IC 1805", commonName: "Heart Nebula", subtitleCn: "心脏星云", kind: "emission", galLonDeg: 134.7, galLatDeg: 0.4, distancePc: 2400, sizeArcmin: 60, color: "#ff5577", intensity: 0.72 },
  { id: "ngc6334", catalogName: "NGC 6334", commonName: "Cat's Paw Nebula", subtitleCn: "猫爪星云", kind: "emission", galLonDeg: 351.3, galLatDeg: 0.7, distancePc: 1700, sizeArcmin: 40, color: "#ff7788", intensity: 0.68 },
  { id: "ngc604", catalogName: "NGC 604", commonName: "NGC 604 (M33)", subtitleCn: "NGC 604", kind: "emission", galLonDeg: 134.0, galLatDeg: -33.6, distancePc: 272000, sizeArcmin: 3.5, color: "#ff6688", intensity: 0.50 },
  { id: "rho_oph", catalogName: "Rho Ophiuchi", commonName: "Rho Ophiuchi Cloud", subtitleCn: "蛇夫座ρ星云", kind: "emission", galLonDeg: 353.0, galLatDeg: 17.0, distancePc: 131, sizeArcmin: 60, color: "#aa88cc", intensity: 0.78 },
  { id: "carina", catalogName: "NGC 3372", commonName: "Carina Nebula", subtitleCn: "船底座大星云", kind: "emission", galLonDeg: 287.6, galLatDeg: -0.6, distancePc: 2600, sizeArcmin: 120, color: "#ff7799", intensity: 0.92 },
  { id: "ngc3576", catalogName: "NGC 3576", commonName: "Statue of Liberty Nebula", subtitleCn: "自由女神星云", kind: "emission", galLonDeg: 291.3, galLatDeg: -0.3, distancePc: 3000, sizeArcmin: 12, color: "#ff8899", intensity: 0.60 },

  // ── Planetary Nebulae ────────────────────────────────────
  { id: "m57", catalogName: "M57 / NGC 6720", commonName: "Ring Nebula", subtitleCn: "环状星云", kind: "planetary", galLonDeg: 63.3, galLatDeg: 13.9, distancePc: 760, sizeArcmin: 2.5, color: "#44aaff", intensity: 0.85 },
  { id: "m27", catalogName: "M27 / NGC 6853", commonName: "Dumbbell Nebula", subtitleCn: "哑铃星云", kind: "planetary", galLonDeg: 59.6, galLatDeg: -3.6, distancePc: 360, sizeArcmin: 8, color: "#55bbff", intensity: 0.82 },
  { id: "ngc6543", catalogName: "NGC 6543", commonName: "Cat's Eye Nebula", subtitleCn: "猫眼星云", kind: "planetary", galLonDeg: 96.4, galLatDeg: 32.7, distancePc: 1100, sizeArcmin: 0.5, color: "#66ccff", intensity: 0.78 },
  { id: "ngc7293", catalogName: "NGC 7293", commonName: "Helix Nebula", subtitleCn: "螺旋星云", kind: "planetary", galLonDeg: 34.0, galLatDeg: -56.7, distancePc: 210, sizeArcmin: 28, color: "#55aadd", intensity: 0.80 },
  { id: "ngc6826", catalogName: "NGC 6826", commonName: "Blinking Planetary", subtitleCn: "眨眼星云", kind: "planetary", galLonDeg: 79.0, galLatDeg: 14.8, distancePc: 1100, sizeArcmin: 0.6, color: "#44bbee", intensity: 0.65 },
  { id: "ngc2392", catalogName: "NGC 2392", commonName: "Eskimo Nebula", subtitleCn: "爱斯基摩星云", kind: "planetary", galLonDeg: 163.0, galLatDeg: 21.6, distancePc: 1300, sizeArcmin: 0.8, color: "#55ccdd", intensity: 0.62 },
  { id: "ngc3132", catalogName: "NGC 3132", commonName: "Southern Ring Nebula", subtitleCn: "南环星云", kind: "planetary", galLonDeg: 272.0, galLatDeg: -23.0, distancePc: 610, sizeArcmin: 1.4, color: "#44aacc", intensity: 0.70 },
  { id: "ngc7027", catalogName: "NGC 7027", commonName: "NGC 7027", subtitleCn: "NGC 7027星云", kind: "planetary", galLonDeg: 77.5, galLatDeg: -3.4, distancePc: 920, sizeArcmin: 0.4, color: "#55bbdd", intensity: 0.60 },

  // ── Supernova Remnants ───────────────────────────────────
  { id: "m1", catalogName: "M1 / NGC 1952", commonName: "Crab Nebula", subtitleCn: "蟹状星云", kind: "supernova-remnant", galLonDeg: 184.6, galLatDeg: -5.8, distancePc: 650, sizeArcmin: 7, color: "#33ddaa", intensity: 0.88 },
  { id: "s147", catalogName: "S147 / Sh2-240", commonName: "Spaghetti Nebula", subtitleCn: "面条星云", kind: "supernova-remnant", galLonDeg: 180.3, galLatDeg: -1.7, distancePc: 1000, sizeArcmin: 180, color: "#22cc88", intensity: 0.50 },
  { id: "ic443", catalogName: "IC 443", commonName: "Jellyfish Nebula", subtitleCn: "水母星云", kind: "supernova-remnant", galLonDeg: 189.1, galLatDeg: 3.0, distancePc: 490, sizeArcmin: 50, color: "#33bbaa", intensity: 0.55 },
  { id: "ngc6960", catalogName: "NGC 6960/6992", commonName: "Veil Nebula", subtitleCn: "面纱星云", kind: "supernova-remnant", galLonDeg: 70.0, galLatDeg: 2.0, distancePc: 520, sizeArcmin: 230, color: "#44ddbb", intensity: 0.65 },
  { id: "vela_sn", catalogName: "Vela SNR", commonName: "Vela Supernova Remnant", subtitleCn: "船帆座超新星遗迹", kind: "supernova-remnant", galLonDeg: 263.0, galLatDeg: -3.0, distancePc: 250, sizeArcmin: 240, color: "#22cc99", intensity: 0.60 },
  { id: "pup_a", catalogName: "Puppis A", commonName: "Puppis A SNR", subtitleCn: "船尾座A超新星遗迹", kind: "supernova-remnant", galLonDeg: 260.4, galLatDeg: -3.7, distancePc: 2100, sizeArcmin: 50, color: "#33ccaa", intensity: 0.50 },
  { id: "cas_a", catalogName: "Cassiopeia A", commonName: "Cassiopeia A SNR", subtitleCn: "仙后座A超新星遗迹", kind: "supernova-remnant", galLonDeg: 111.7, galLatDeg: -2.1, distancePc: 3400, sizeArcmin: 5, color: "#33ddbb", intensity: 0.65 },
  { id: "rcw86", catalogName: "RCW 86 / MSH 14-63", commonName: "RCW 86 SNR", subtitleCn: "RCW 86超新星遗迹", kind: "supernova-remnant", galLonDeg: 315.4, galLatDeg: -2.5, distancePc: 2700, sizeArcmin: 45, color: "#33bbaa", intensity: 0.48 },

  // ── Dark Nebulae ─────────────────────────────────────────
  { id: "b33", catalogName: "B33", commonName: "Horsehead Dark Nebula", subtitleCn: "马头暗星云", kind: "dark", galLonDeg: 206.8, galLatDeg: -16.5, distancePc: 412, sizeArcmin: 6, color: "#443322", intensity: 0.50 },
  { id: "b72", catalogName: "B72", commonName: "Snake Nebula", subtitleCn: "蛇形暗星云", kind: "dark", galLonDeg: 0.5, galLatDeg: 3.5, distancePc: 200, sizeArcmin: 10, color: "#332211", intensity: 0.40 },
  { id: "coalsack", catalogName: "Coalsack", commonName: "Coalsack Nebula", subtitleCn: "煤袋暗星云", kind: "dark", galLonDeg: 303.0, galLatDeg: -1.0, distancePc: 180, sizeArcmin: 400, color: "#221100", intensity: 0.55 },
  { id: "pipe", catalogName: "LDN 1773", commonName: "Pipe Nebula", subtitleCn: "管道暗星云", kind: "dark", galLonDeg: 0.0, galLatDeg: 5.0, distancePc: 180, sizeArcmin: 300, color: "#332211", intensity: 0.45 },
  { id: "cone", catalogName: "NGC 2264", commonName: "Cone Nebula", subtitleCn: "锥形星云", kind: "dark", galLonDeg: 202.9, galLatDeg: 2.2, distancePc: 800, sizeArcmin: 10, color: "#443322", intensity: 0.45 },

  // ── Reflection Nebulae ───────────────────────────────────
  { id: "m78", catalogName: "M78 / NGC 2068", commonName: "M78 Reflection Nebula", subtitleCn: "M78反射星云", kind: "reflection", galLonDeg: 204.8, galLatDeg: -1.4, distancePc: 412, sizeArcmin: 8, color: "#7788dd", intensity: 0.65 },
  { id: "ngc7023", catalogName: "NGC 7023", commonName: "Iris Nebula", subtitleCn: "鸢尾花星云", kind: "reflection", galLonDeg: 98.5, galLatDeg: 5.5, distancePc: 400, sizeArcmin: 18, color: "#8899ee", intensity: 0.62 },
  { id: "ngc1435", catalogName: "NGC 1435", commonName: "Merope Nebula (Pleiades)", subtitleCn: "昴宿五星云", kind: "reflection", galLonDeg: 166.8, galLatDeg: -23.5, distancePc: 130, sizeArcmin: 30, color: "#7788cc", intensity: 0.55 },
  { id: "ngc1333", catalogName: "NGC 1333", commonName: "NGC 1333", subtitleCn: "NGC 1333反射星云", kind: "reflection", galLonDeg: 157.6, galLatDeg: -18.4, distancePc: 300, sizeArcmin: 6, color: "#8899dd", intensity: 0.55 },

  // ── Additional Emission Nebulae ───────────────────────────
  { id: "ngc2174", catalogName: "NGC 2174", commonName: "Monkey Head Nebula", subtitleCn: "猴头星云", kind: "emission", galLonDeg: 192.1, galLatDeg: -0.4, distancePc: 2100, sizeArcmin: 40, color: "#ff7788", intensity: 0.60 },
  { id: "ngc2359", catalogName: "NGC 2359", commonName: "Thor's Helmet", subtitleCn: "雷神头盔星云", kind: "emission", galLonDeg: 238.0, galLatDeg: -3.4, distancePc: 3700, sizeArcmin: 9, color: "#ff88aa", intensity: 0.58 },
  { id: "ic2944", catalogName: "IC 2944", commonName: "Running Chicken Nebula", subtitleCn: "奔鸡星云", kind: "emission", galLonDeg: 287.0, galLatDeg: -1.3, distancePc: 1900, sizeArcmin: 60, color: "#ff99aa", intensity: 0.62 },
  { id: "ngc6188", catalogName: "NGC 6188", commonName: "Rim Nebula", subtitleCn: "边缘星云", kind: "emission", galLonDeg: 336.0, galLatDeg: -0.5, distancePc: 3200, sizeArcmin: 20, color: "#ff6677", intensity: 0.58 },
  { id: "ngc6357", catalogName: "NGC 6357", commonName: "War and Peace Nebula", subtitleCn: "战争与和平星云", kind: "emission", galLonDeg: 353.0, galLatDeg: 1.0, distancePc: 2500, sizeArcmin: 25, color: "#ff7788", intensity: 0.62 },
  { id: "sh2_155", catalogName: "Sh2-155", commonName: "Cave Nebula", subtitleCn: "洞穴星云", kind: "emission", galLonDeg: 138.5, galLatDeg: 2.0, distancePc: 2100, sizeArcmin: 35, color: "#ff8899", intensity: 0.55 },
  { id: "ngc1491", catalogName: "NGC 1491", commonName: "Fossil Footprint Nebula", subtitleCn: "化石足迹星云", kind: "emission", galLonDeg: 156.3, galLatDeg: -6.0, distancePc: 3200, sizeArcmin: 15, color: "#ff7799", intensity: 0.52 },
  { id: "rcw49", catalogName: "RCW 49", commonName: "RCW 49", subtitleCn: "RCW 49星云", kind: "emission", galLonDeg: 284.0, galLatDeg: -0.5, distancePc: 4200, sizeArcmin: 30, color: "#ff8899", intensity: 0.55 },

  // ── Additional Planetary Nebulae ──────────────────────────
  { id: "ngc2438", catalogName: "NGC 2438", commonName: "NGC 2438", subtitleCn: "NGC 2438行星状星云", kind: "planetary", galLonDeg: 238.0, galLatDeg: -2.0, distancePc: 1400, sizeArcmin: 1.1, color: "#55aadd", intensity: 0.55 },
  { id: "ngc6302", catalogName: "NGC 6302", commonName: "Bug Nebula", subtitleCn: "蝴蝶星云(行星状)", kind: "planetary", galLonDeg: 350.0, galLatDeg: -4.0, distancePc: 1100, sizeArcmin: 1.5, color: "#66bbdd", intensity: 0.65 },
  // v33 deep-sky navigation readability additions.
  { id: "ngc1499", catalogName: "NGC 1499", commonName: "California Nebula", subtitleCn: "California Nebula", kind: "emission", galLonDeg: 160.1, galLatDeg: -12.3, distancePc: 470, sizeArcmin: 160, color: "#ff6f91", intensity: 0.68 },
  { id: "ic2118", catalogName: "IC 2118", commonName: "Witch Head Nebula", subtitleCn: "Witch Head Nebula", kind: "reflection", galLonDeg: 208.9, galLatDeg: -27.7, distancePc: 300, sizeArcmin: 180, color: "#8199dd", intensity: 0.50 },
  { id: "ic5146", catalogName: "IC 5146 / Caldwell 19", commonName: "Cocoon Nebula", subtitleCn: "Cocoon Nebula", kind: "emission", galLonDeg: 94.4, galLatDeg: -5.5, distancePc: 800, sizeArcmin: 12, color: "#ff7f9c", intensity: 0.62 },
  { id: "ngc6888", catalogName: "NGC 6888", commonName: "Crescent Nebula", subtitleCn: "Crescent Nebula", kind: "emission", galLonDeg: 75.5, galLatDeg: 2.4, distancePc: 1500, sizeArcmin: 18, color: "#ff88aa", intensity: 0.60 },
  // v107 interaction/catalog completion: offline curated presentation markers.
  { id: "ngc7635", catalogName: "NGC 7635", commonName: "Bubble Nebula", subtitleCn: "Bubble Nebula", kind: "emission", galLonDeg: 112.2, galLatDeg: 0.2, distancePc: 2400, sizeArcmin: 15, color: "#ff7f9f", intensity: 0.64 },
  { id: "ngc7380", catalogName: "NGC 7380", commonName: "Wizard Nebula", subtitleCn: "Wizard Nebula", kind: "emission", galLonDeg: 107.2, galLatDeg: -0.9, distancePc: 2200, sizeArcmin: 25, color: "#ff7896", intensity: 0.60 },
  { id: "ic5070", catalogName: "IC 5070", commonName: "Pelican Nebula", subtitleCn: "Pelican Nebula", kind: "emission", galLonDeg: 84.6, galLatDeg: -0.5, distancePc: 600, sizeArcmin: 60, color: "#ff7890", intensity: 0.68 },
  { id: "ic405", catalogName: "IC 405", commonName: "Flaming Star Nebula", subtitleCn: "Flaming Star Nebula", kind: "emission", galLonDeg: 172.1, galLatDeg: -2.3, distancePc: 450, sizeArcmin: 30, color: "#ff866f", intensity: 0.62 },
  { id: "ic410", catalogName: "IC 410", commonName: "Tadpoles Nebula", subtitleCn: "Tadpoles Nebula", kind: "emission", galLonDeg: 173.6, galLatDeg: -1.7, distancePc: 3700, sizeArcmin: 40, color: "#ff7390", intensity: 0.58 },
  { id: "ic2177", catalogName: "IC 2177", commonName: "Seagull Nebula", subtitleCn: "Seagull Nebula", kind: "emission", galLonDeg: 223.7, galLatDeg: -1.9, distancePc: 1100, sizeArcmin: 120, color: "#ff91a8", intensity: 0.62 },
  { id: "ngc1977", catalogName: "NGC 1977", commonName: "Running Man Nebula", subtitleCn: "Running Man Nebula", kind: "reflection", galLonDeg: 208.5, galLatDeg: -19.1, distancePc: 400, sizeArcmin: 40, color: "#778fe0", intensity: 0.58 },
  { id: "ngc2070", catalogName: "NGC 2070", commonName: "Tarantula Nebula", subtitleCn: "Tarantula Nebula", kind: "emission", galLonDeg: 279.5, galLatDeg: -31.7, distancePc: 50000, sizeArcmin: 40, color: "#ff6f91", intensity: 0.88 },
  { id: "ic63", catalogName: "IC 63", commonName: "Ghost of Cassiopeia", subtitleCn: "Ghost of Cassiopeia", kind: "reflection", galLonDeg: 123.6, galLatDeg: -2.2, distancePc: 190, sizeArcmin: 10, color: "#8297db", intensity: 0.54 },
  { id: "sh2_101", catalogName: "Sh2-101", commonName: "Tulip Nebula", subtitleCn: "Tulip Nebula", kind: "emission", galLonDeg: 79.1, galLatDeg: 2.8, distancePc: 1800, sizeArcmin: 20, color: "#ff7897", intensity: 0.58 },
  { id: "ngc7822", catalogName: "NGC 7822", commonName: "NGC 7822", subtitleCn: "NGC 7822", kind: "emission", galLonDeg: 118.5, galLatDeg: 6.0, distancePc: 900, sizeArcmin: 60, color: "#ff8299", intensity: 0.60 },
  { id: "ic4628", catalogName: "IC 4628", commonName: "Prawn Nebula", subtitleCn: "Prawn Nebula", kind: "emission", galLonDeg: 343.5, galLatDeg: 1.2, distancePc: 1800, sizeArcmin: 60, color: "#ff7592", intensity: 0.64 },
  { id: "ic4592", catalogName: "IC 4592", commonName: "Blue Horsehead Nebula", subtitleCn: "Blue Horsehead Nebula", kind: "reflection", galLonDeg: 353.1, galLatDeg: 20.9, distancePc: 130, sizeArcmin: 60, color: "#718cdf", intensity: 0.60 },
  { id: "m97", catalogName: "M97 / NGC 3587", commonName: "Owl Nebula", subtitleCn: "Owl Nebula", kind: "planetary", galLonDeg: 148.5, galLatDeg: 57.1, distancePc: 800, sizeArcmin: 3.4, color: "#5bc6e8", intensity: 0.72 },
  { id: "m76", catalogName: "M76 / NGC 650", commonName: "Little Dumbbell Nebula", subtitleCn: "Little Dumbbell Nebula", kind: "planetary", galLonDeg: 130.9, galLatDeg: -10.5, distancePc: 780, sizeArcmin: 2.7, color: "#58bde5", intensity: 0.70 },
  { id: "ngc7009", catalogName: "NGC 7009", commonName: "Saturn Nebula", subtitleCn: "Saturn Nebula", kind: "planetary", galLonDeg: 37.8, galLatDeg: -34.6, distancePc: 1400, sizeArcmin: 0.5, color: "#55c9e8", intensity: 0.74 },
  { id: "ngc7662", catalogName: "NGC 7662", commonName: "Blue Snowball Nebula", subtitleCn: "Blue Snowball Nebula", kind: "planetary", galLonDeg: 106.6, galLatDeg: -17.6, distancePc: 1200, sizeArcmin: 0.5, color: "#4ca9ef", intensity: 0.76 },
  { id: "ngc3242", catalogName: "NGC 3242", commonName: "Ghost of Jupiter", subtitleCn: "Ghost of Jupiter", kind: "planetary", galLonDeg: 261.1, galLatDeg: 32.0, distancePc: 420, sizeArcmin: 0.7, color: "#59c7e4", intensity: 0.74 },
  { id: "abell21", catalogName: "Abell 21", commonName: "Medusa Nebula", subtitleCn: "Medusa Nebula", kind: "planetary", galLonDeg: 205.1, galLatDeg: 14.2, distancePc: 460, sizeArcmin: 10, color: "#62bddb", intensity: 0.62 },
  { id: "ngc2736", catalogName: "NGC 2736", commonName: "Pencil Nebula", subtitleCn: "Pencil Nebula", kind: "supernova-remnant", galLonDeg: 266.4, galLatDeg: -1.3, distancePc: 250, sizeArcmin: 30, color: "#38c8ae", intensity: 0.58 },
  { id: "ngc6309", catalogName: "NGC 6309", commonName: "Box Nebula", subtitleCn: "Box Nebula", kind: "planetary", galLonDeg: 9.6, galLatDeg: 14.8, distancePc: 2000, sizeArcmin: 0.3, color: "#58b9df", intensity: 0.60 },
];
