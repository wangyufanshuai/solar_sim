/**
 * Named asterisms used as a secondary guide layer.
 *
 * These are not IAU constellations and never enter the physics or formal
 * constellation catalog.  Coordinates are static J2000 presentation points
 * from the local v255 reference set.
 */

export type AsterismDef = {
  id: string;
  name: string;
  nameCn: string;
  source: "curated-local-v255-asterism-reference-set";
  isOfficialConstellation: false;
  waypoints: [number, number][];
};

const source = "curated-local-v255-asterism-reference-set" as const;

export const ASTERISM_LINES: readonly AsterismDef[] = [
  { id: "big-dipper", name: "Big Dipper", nameCn: "北斗七星", source, isOfficialConstellation: false, waypoints: [[165.9, 61.8], [178.5, 53.7], [194.0, 55.9], [201.3, 54.9], [206.9, 49.3]] },
  { id: "little-dipper", name: "Little Dipper", nameCn: "小北斗", source, isOfficialConstellation: false, waypoints: [[37.9, 89.3], [263.0, 86.6], [237.0, 82.0], [226.0, 67.6]] },
  { id: "great-square", name: "Great Square", nameCn: "秋季四边形", source, isOfficialConstellation: false, waypoints: [[2.1, 29.1], [327.8, 28.1], [350.9, 6.2], [3.4, 15.2], [2.1, 29.1]] },
  { id: "summer-triangle", name: "Summer Triangle", nameCn: "夏季大三角", source, isOfficialConstellation: false, waypoints: [[279.2, 38.8], [310.4, 45.3], [297.7, 8.9], [279.2, 38.8]] },
  { id: "winter-triangle", name: "Winter Triangle", nameCn: "冬季大三角", source, isOfficialConstellation: false, waypoints: [[101.3, -16.7], [114.8, 5.2], [95.9, -52.7], [101.3, -16.7]] },
  { id: "winter-hexagon", name: "Winter Hexagon", nameCn: "冬季六边形", source, isOfficialConstellation: false, waypoints: [[79.2, 45.9], [88.8, 7.4], [101.3, -16.7], [95.9, -52.7], [78.6, -8.2], [56.8, 24.1], [79.2, 45.9]] },
  { id: "spring-triangle", name: "Spring Triangle", nameCn: "春季大三角", source, isOfficialConstellation: false, waypoints: [[213.9, 19.2], [186.6, 38.8], [178.0, 53.7], [213.9, 19.2]] },
  { id: "great-diamond", name: "Great Diamond", nameCn: "春季大钻石", source, isOfficialConstellation: false, waypoints: [[213.9, 19.2], [186.6, 38.8], [178.0, 53.7], [168.5, 6.3], [213.9, 19.2]] },
  { id: "keystone", name: "Keystone", nameCn: "武仙座四边形", source, isOfficialConstellation: false, waypoints: [[247.0, 14.4], [250.3, 31.6], [258.0, 29.0], [255.0, 15.0], [247.0, 14.4]] },
  { id: "teapot", name: "Teapot", nameCn: "茶壶", source, isOfficialConstellation: false, waypoints: [[276.0, -30.4], [281.4, -29.8], [286.4, -29.9], [289.3, -20.8], [274.4, -25.4], [276.0, -30.4]] },
  { id: "northern-cross", name: "Northern Cross", nameCn: "北十字", source, isOfficialConstellation: false, waypoints: [[310.4, 45.3], [305.6, 40.3], [292.7, 28.0], [305.6, 40.3], [298.0, 45.0]] },
  { id: "circlet", name: "Circlet of Pisces", nameCn: "双鱼座环", source, isOfficialConstellation: false, waypoints: [[344.4, 3.3], [350.9, 6.2], [357.0, 19.2], [8.0, 27.0], [16.0, 20.5], [344.4, 3.3]] },
  { id: "fish-hook", name: "Fish Hook", nameCn: "鱼钩", source, isOfficialConstellation: false, waypoints: [[247.0, -26.4], [252.0, -26.1], [258.0, -30.0], [264.3, -34.3], [266.4, -29.0]] },
  { id: "false-cross", name: "False Cross", nameCn: "假十字", source, isOfficialConstellation: false, waypoints: [[168.5, -57.0], [186.6, -63.1], [185.0, -58.7], [168.5, -57.0]] },
  { id: "southern-cross", name: "Southern Cross", nameCn: "南十字", source, isOfficialConstellation: false, waypoints: [[186.6, -63.1], [191.9, -59.7], [187.8, -57.1], [183.8, -57.0], [186.6, -63.1]] },
  { id: "diamond-of-virgo", name: "Diamond of Virgo", nameCn: "室女座菱形", source, isOfficialConstellation: false, waypoints: [[201.3, -11.2], [213.9, 19.2], [219.9, -1.4], [190.0, 11.9], [201.3, -11.2]] },
  { id: "sickle", name: "Sickle", nameCn: "镰刀", source, isOfficialConstellation: false, waypoints: [[152.1, 11.9], [154.9, 19.7], [153.4, 23.4], [155.6, 26.7], [140.3, 27.1]] },
  { id: "kids", name: "Kids", nameCn: "小羊羔", source, isOfficialConstellation: false, waypoints: [[79.2, 45.9], [75.5, 44.9], [84.0, 33.2], [83.8, 30.3]] },
  { id: "water-jar", name: "Water Jar", nameCn: "宝瓶座水罐", source, isOfficialConstellation: false, waypoints: [[322.9, -0.3], [326.0, -1.4], [331.4, -0.8], [335.4, -1.4]] },
  { id: "coathanger", name: "Coathanger", nameCn: "衣架星群", source, isOfficialConstellation: false, waypoints: [[291.6, 20.3], [294.5, 19.0], [297.0, 20.1], [300.0, 19.0], [303.0, 20.0], [306.0, 19.0]] },
  { id: "golf-club", name: "Golf Club", nameCn: "高尔夫球杆", source, isOfficialConstellation: false, waypoints: [[285.0, 33.4], [282.6, 32.7], [279.2, 38.8], [276.0, 37.6]] },
  { id: "lozenge", name: "Lozenge", nameCn: "天琴座菱形", source, isOfficialConstellation: false, waypoints: [[279.2, 38.8], [282.5, 36.9], [285.0, 33.4], [282.6, 32.7], [279.2, 38.8]] },
  { id: "leaping-minnow", name: "Leaping Minnow", nameCn: "跳跃小鱼", source, isOfficialConstellation: false, waypoints: [[296.0, 18.6], [298.5, 19.5], [301.5, 17.0], [304.0, 15.0]] },
  { id: "great-owl", name: "Great Owl", nameCn: "大猫头鹰", source, isOfficialConstellation: false, waypoints: [[165.5, 56.4], [178.5, 53.7], [194.0, 55.9], [206.9, 49.3]] },
  { id: "head-of-hydra", name: "Head of Hydra", nameCn: "长蛇座头部", source, isOfficialConstellation: false, waypoints: [[139.3, 6.0], [140.3, 3.4], [143.2, 5.9], [145.0, 7.0]] },
  { id: "arabian-horse", name: "Arabian Horse", nameCn: "阿拉伯飞马", source, isOfficialConstellation: false, waypoints: [[345.9, 28.1], [327.8, 28.1], [346.0, 15.2], [350.0, 6.2]] },
  { id: "mirror-of-venus", name: "Mirror of Venus", nameCn: "金星之镜", source, isOfficialConstellation: false, waypoints: [[186.6, 38.8], [190.0, 11.9], [201.3, -11.2], [213.9, 19.2]] },
  { id: "job-coffin", name: "Job's Coffin", nameCn: "约伯的棺材", source, isOfficialConstellation: false, waypoints: [[302.5, 10.6], [303.0, 6.4], [307.0, 10.5], [309.0, 15.9], [302.5, 10.6]] },
  { id: "diamond-of-scorpius", name: "Diamond of Scorpius", nameCn: "天蝎座菱形", source, isOfficialConstellation: false, waypoints: [[247.0, -26.4], [252.0, -26.1], [258.0, -30.0], [264.3, -34.3]] },
  { id: "great-scorpion", name: "Great Scorpion", nameCn: "大蝎钩", source, isOfficialConstellation: false, waypoints: [[247.0, -26.4], [252.0, -26.1], [258.0, -30.0], [264.3, -34.3], [266.4, -29.0], [247.0, -26.4]] },
  { id: "southern-fish", name: "Southern Fish", nameCn: "南鱼", source, isOfficialConstellation: false, waypoints: [[344.4, -30.6], [344.0, -29.6], [345.0, -32.5], [346.0, -33.0]] },
  { id: "great-bird", name: "Great Bird", nameCn: "天鸟", source, isOfficialConstellation: false, waypoints: [[310.4, 45.3], [279.2, 38.8], [297.7, 8.9], [310.4, 45.3]] },
];

export const ASTERISM_LINE_COUNT = ASTERISM_LINES.length;
