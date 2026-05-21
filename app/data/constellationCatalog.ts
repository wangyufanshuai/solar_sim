/**
 * 88 IAU constellation stick-figure catalog.
 * Waypoints use [RA degrees (J2000), Dec degrees (J2000)].
 * Consecutive pairs form line segments.
 */

export type ConstellationLineDef = {
  iauCode: string;
  name: string;
  nameCn: string;
  waypoints: [number, number][];
};

export const CONSTELLATION_LINES: ConstellationLineDef[] = [
  // ═══════════════════════════════════════════════════════════
  // NORTHERN CIRCUMPOLAR & HIGH DECLINATION
  // ═══════════════════════════════════════════════════════════

  // Ursa Major — Big Dipper asterism
  { iauCode: "UMa", name: "Ursa Major", nameCn: "大熊座", waypoints: [
    [158.63, 61.75],  // Dubhe α
    [165.46, 55.96],  // Merak β
    [178.46, 53.69],  // Phecda γ
    [183.86, 57.03],  // Megrez δ
    [194.0, 55.96],   // Alioth ε
    [201.3, 54.93],   // Mizar ζ
    [206.89, 49.31],  // Alkaid η
  ]},

  // Ursa Minor — Little Dipper
  { iauCode: "UMi", name: "Ursa Minor", nameCn: "小熊座", waypoints: [
    [37.95, 89.26],   // Polaris α
    [263.0, 86.59],   // β UMi
    [237.0, 82.0],    // γ UMi (Pherkad)
    [231.0, 74.2],    // δ UMi
    [226.0, 67.6],    // ε UMi
    [234.0, 75.8],    // ζ UMi
    [244.0, 77.8],    // η UMi
  ]},

  // Cassiopeia — W shape
  { iauCode: "Cas", name: "Cassiopeia", nameCn: "仙后座", waypoints: [
    [2.29, 59.15],    // Caph β
    [10.13, 56.54],   // Schedar α
    [14.18, 60.72],   // γ Cas
    [21.45, 60.24],   // Ruchbah δ
    [28.60, 63.67],   // Segin ε
  ]},

  // Cepheus — house shape
  { iauCode: "Cep", name: "Cepheus", nameCn: "仙王座", waypoints: [
    [326.05, 58.0],   // Alderamin α
    [331.0, 66.5],    // β Cep
    [327.0, 70.5],    // γ Cep (Errai)
    [336.0, 77.6],    // δ Cep
    [339.0, 67.6],    // ε Cep
    [331.0, 66.5],    // back to β
  ]},

  // Draco — winding dragon
  { iauCode: "Dra", name: "Draco", nameCn: "天龙座", waypoints: [
    [263.05, 52.30],  // Eltanin γ
    [266.0, 55.0],    // β Dra (Rastaban)
    [260.0, 51.5],    // ξ Dra
    [250.0, 57.6],    // ν Dra
    [239.0, 62.0],    // μ Dra
    [232.0, 65.9],    // κ Dra
    [223.0, 72.2],    // ι Dra
    [210.0, 75.7],    // θ Dra
    [190.0, 73.0],    // η Dra
    [179.0, 64.7],    // δ Dra
    [172.0, 57.0],    // χ Dra
    [165.0, 58.9],    // φ Dra
  ]},

  // Camelopardalis — giraffe (faint, simple line)
  { iauCode: "Cam", name: "Camelopardalis", nameCn: "鹿豹座", waypoints: [
    [82.0, 73.5],     // β Cam
    [63.0, 68.5],     // α Cam
    [53.0, 58.5],     // γ Cam
    [41.0, 58.1],     // 7 Cam
  ]},

  // Lynx — faint cat
  { iauCode: "Lyn", name: "Lynx", nameCn: "天猫座", waypoints: [
    [97.0, 59.0],     // α Lyn
    [101.0, 52.6],    // 38 Lyn
    [107.0, 47.0],    // 31 Lyn
    [112.0, 43.0],    // 21 Lyn
  ]},

  // ═══════════════════════════════════════════════════════════
  // NORTHERN — AUTUMN/WINTER GROUP
  // ═══════════════════════════════════════════════════════════

  // Perseus — hero
  { iauCode: "Per", name: "Perseus", nameCn: "英仙座", waypoints: [
    [51.08, 49.86],   // Mirfak α
    [55.0, 44.9],     // δ Per
    [56.0, 40.0],     // μ Per
    [50.0, 45.5],     // ε Per
    [44.0, 47.8],     // ν Per
    [51.08, 49.86],   // back to Mirfak
    [56.8, 40.96],    // Algol β
  ]},

  // Andromeda — chained maiden
  { iauCode: "And", name: "Andromeda", nameCn: "仙女座", waypoints: [
    [2.10, 29.09],    // Alpheratz α
    [8.0, 27.0],      // δ And
    [12.0, 23.5],     // Mirach β
    [16.0, 20.5],     // γ And (Almach)
    [12.0, 23.5],     // back to Mirach
    [9.0, 30.8],      // π And
  ]},

  // Pegasus — winged horse (Great Square)
  { iauCode: "Peg", name: "Pegasus", nameCn: "飞马座", waypoints: [
    [345.94, 28.08],  // Enif ε
    [346.0, 15.2],    // θ Peg
    [350.0, 6.2],     // ι Peg
    [344.4, 3.3],     // κ Peg
    [345.94, 28.08],  // back to Enif
    [327.0, 24.5],    // μ Peg
    [327.79, 28.08],  // Scheat β
    [2.10, 29.09],    // Markab α / Alpheratz
    [357.0, 19.2],    // γ Peg (Algenib)
    [350.0, 6.2],     // to ι Peg
  ]},

  // Triangulum — triangle
  { iauCode: "Tri", name: "Triangulum", nameCn: "三角座", waypoints: [
    [27.55, 33.33],   // β Tri
    [23.46, 30.91],   // α Tri
    [31.0, 28.5],     // γ Tri
    [27.55, 33.33],   // back to β
  ]},

  // Lacerta — lizard
  { iauCode: "Lac", name: "Lacerta", nameCn: "蝎虎座", waypoints: [
    [339.0, 54.0],    // α Lac
    [345.0, 49.4],    // β Lac
    [350.0, 45.5],    // γ Lac
    [355.0, 40.5],    // δ Lac
    [349.0, 36.5],    // ε Lac
  ]},

  // Auriga — charioteer
  { iauCode: "Aur", name: "Auriga", nameCn: "御夫座", waypoints: [
    [79.17, 46.0],     // Capella α
    [75.5, 44.9],      // Menkalinen β
    [79.5, 38.9],      // θ Aur
    [84.0, 33.2],      // ζ Aur
    [84.0, 21.1],      // El Nath β (shared with Taurus)
    [79.5, 38.9],      // back to θ
    [83.5, 43.8],      // δ Aur
  ]},

  // ═══════════════════════════════════════════════════════════
  // NORTHERN — SUMMER GROUP
  // ═══════════════════════════════════════════════════════════

  // Cygnus — Northern Cross
  { iauCode: "Cyg", name: "Cygnus", nameCn: "天鹅座", waypoints: [
    [310.36, 45.28],  // Deneb α
    [305.56, 40.26],  // Sadr γ
    [292.68, 27.96],  // Albireo β
    [305.56, 40.26],  // back to Sadr
    [312.5, 35.0],    // δ Cyg
    [305.56, 40.26],  // back to Sadr
    [298.0, 45.0],    // ε Cyg (Gienah)
  ]},

  // Lyra — lyre
  { iauCode: "Lyr", name: "Lyra", nameCn: "天琴座", waypoints: [
    [279.23, 38.78],  // Vega α
    [282.52, 36.90],  // ε1 Lyr
    [285.0, 33.36],   // ζ Lyr
    [282.64, 32.69],  // δ Lyr
    [279.23, 38.78],  // back to Vega
    [276.0, 37.6],    // β Lyr (Sheliak)
  ]},

  // Aquila — eagle
  { iauCode: "Aql", name: "Aquila", nameCn: "天鹰座", waypoints: [
    [297.70, 8.87],   // Altair α
    [292.0, 10.61],   // γ Aql (Tarazed)
    [284.0, 13.86],   // β Aql (Alshain)
    [297.70, 8.87],   // back to Altair
    [303.0, 6.4],     // θ Aql
    [307.0, 10.5],    // δ Aql
    [299.0, 15.07],   // ζ Aql
  ]},

  // Sagitta — arrow
  { iauCode: "Sge", name: "Sagitta", nameCn: "天箭座", waypoints: [
    [296.0, 18.6],    // γ Sge
    [298.5, 19.5],    // α Sge
    [301.5, 17.0],    // β Sge
    [299.5, 16.3],    // δ Sge
  ]},

  // Delphinus — dolphin
  { iauCode: "Del", name: "Delphinus", nameCn: "海豚座", waypoints: [
    [309.0, 15.9],    // α Del (Sualocin)
    [311.0, 14.6],    // β Del (Rotanev)
    [313.0, 12.0],    // δ Del
    [309.0, 11.3],    // γ Del
    [309.0, 15.9],    // back to α
  ]},

  // Vulpecula — fox (small)
  { iauCode: "Vul", name: "Vulpecula", nameCn: "狐狸座", waypoints: [
    [305.56, 24.67],  // α Vul
    [310.0, 22.0],    // 4 Vul
    [314.0, 24.5],    // 3 Vul
  ]},

  // Equuleus — little horse
  { iauCode: "Equ", name: "Equuleus", nameCn: "小马座", waypoints: [
    [313.0, 5.25],    // α Equ (Kitalpha)
    [315.0, 7.0],     // γ Equ
    [317.0, 5.0],     // δ Equ
    [313.0, 5.25],    // back to α
  ]},

  // Hercules — hero
  { iauCode: "Her", name: "Hercules", nameCn: "武仙座", waypoints: [
    [262.0, 14.39],   // Kornephoros β
    [255.0, 14.0],    // ζ Her
    [246.0, 17.0],    // η Her
    [242.0, 14.0],    // ε Her
    [248.0, 27.8],    // δ Her (Sarin)
    [258.0, 21.5],    // π Her
    [262.0, 14.39],   // back to β
    [267.0, 27.8],    // Rasalgethi α
  ]},

  // Corona Borealis — northern crown
  { iauCode: "CrB", name: "Corona Borealis", nameCn: "北冕座", waypoints: [
    [232.0, 26.71],   // Alphecca α
    [234.0, 29.0],    // β CrB
    [238.0, 29.9],    // γ CrB
    [241.0, 27.8],    // δ CrB
    [238.0, 25.8],    // ε CrB
    [235.0, 24.0],    // θ CrB
    [232.0, 26.71],   // back to α
  ]},

  // Boötes — herdsman (kite shape)
  { iauCode: "Boo", name: "Boötes", nameCn: "牧夫座", waypoints: [
    [213.92, 19.18],  // Arcturus α
    [216.0, 22.0],    // ζ Boo
    [218.0, 26.3],    // η Boo
    [222.0, 40.39],   // Seginus γ
    [209.0, 45.0],    // β Boo (Nekkar)
    [203.0, 38.3],    // ρ Boo
    [205.0, 30.4],    // δ Boo
    [213.92, 19.18],  // back to Arcturus
  ]},

  // Canes Venatici — hunting dogs
  { iauCode: "CVn", name: "Canes Venatici", nameCn: "猎犬座", waypoints: [
    [194.0, 38.3],    // Cor Caroli α
    [191.0, 40.8],    // β CVn
    [189.0, 34.0],    // γ CVn
  ]},

  // Coma Berenices — Berenice's hair
  { iauCode: "Com", name: "Coma Berenices", nameCn: "后发座", waypoints: [
    [186.0, 23.8],    // α Com (Diadem)
    [182.0, 22.0],    // β Com
    [178.0, 18.5],    // γ Com
    [175.0, 24.0],    // 12 Com
    [186.0, 23.8],    // back to α
  ]},

  // Leo Minor — little lion
  { iauCode: "LMi", name: "Leo Minor", nameCn: "小狮座", waypoints: [
    [149.0, 32.4],    // 46 LMi (Praecipua)
    [152.0, 26.0],    // β LMi
    [156.0, 21.0],    // 21 LMi
  ]},

  // ═══════════════════════════════════════════════════════════
  // ZODIAC CONSTELLATIONS
  // ═══════════════════════════════════════════════════════════

  // Aries — ram
  { iauCode: "Ari", name: "Aries", nameCn: "白羊座", waypoints: [
    [31.79, 23.46],   // Hamal α
    [28.66, 20.81],   // Sheratan β
    [27.0, 19.3],     // γ Ari (Mesarthim)
    [28.66, 20.81],   // back to β
    [34.0, 27.3],     // δ Ari (Botein)
  ]},

  // Taurus — bull
  { iauCode: "Tau", name: "Taurus", nameCn: "金牛座", waypoints: [
    [68.98, 16.51],   // Aldebaran α
    [82.25, 15.87],   // Elnath β
    [84.0, 21.1],     // ζ Tau
    [79.0, 28.0],     // Auriga border
    [68.98, 16.51],   // back to Aldebaran
    [56.0, 21.1],     // λ Tau
    [52.0, 23.5],     // ξ Tau
  ]},

  // Gemini — twins
  { iauCode: "Gem", name: "Gemini", nameCn: "双子座", waypoints: [
    [116.33, 28.03],  // Pollux β
    [111.60, 31.89],  // Castor α
    [100.98, 25.13],  // Alhena γ
    [97.0, 23.5],     // μ Gem
    [103.5, 24.5],    // ε Gem
    [110.0, 20.0],    // ζ Gem
    [116.33, 28.03],  // back to Pollux
  ]},

  // Cancer — crab
  { iauCode: "Cnc", name: "Cancer", nameCn: "巨蟹座", waypoints: [
    [137.0, 11.0],    // α Cnc (Acubens)
    [130.0, 9.2],     // β Cnc (Tarf)
    [125.0, 21.5],    // δ Cnc (Asellus Australis)
    [127.0, 21.0],    // γ Cnc (Asellus Borealis)
    [137.0, 11.0],    // back to α
  ]},

  // Leo — lion
  { iauCode: "Leo", name: "Leo", nameCn: "狮子座", waypoints: [
    [152.09, 11.97],  // Regulus α
    [145.7, 15.0],    // η Leo
    [142.5, 16.0],    // γ Leo (Algieba)
    [140.0, 23.77],   // Zosma δ
    [131.8, 24.0],    // Chertan θ
    [146.46, 23.77],  // Denebola β
    [140.0, 23.77],   // back to Zosma
  ]},

  // Virgo — maiden
  { iauCode: "Vir", name: "Virgo", nameCn: "室女座", waypoints: [
    [201.30, -11.16],  // Spica α
    [194.0, -5.5],     // γ Vir (Porrima)
    [185.0, -3.4],     // δ Vir (Minelauva)
    [173.0, 1.8],      // ε Vir (Vindemiatrix)
    [185.0, -3.4],     // back to δ
    [190.0, -8.5],     // η Vir
    [201.30, -11.16],  // back to Spica
    [207.0, -10.5],    // ζ Vir
  ]},

  // Libra — scales
  { iauCode: "Lib", name: "Libra", nameCn: "天秤座", waypoints: [
    [229.25, -9.38],  // Zubenelgenubi α
    [233.0, -14.8],   // Zubeneschamali β
    [236.0, -15.6],   // γ Lib
    [240.0, -14.8],   // δ Lib
    [233.0, -14.8],   // back to β
    [229.25, -9.38],  // back to α
  ]},

  // Scorpius — scorpion
  { iauCode: "Sco", name: "Scorpius", nameCn: "天蝎座", waypoints: [
    [247.35, -26.43],  // Antares α
    [245.3, -22.6],
    [242.0, -19.8],    // Dschubba δ
    [240.1, -22.6],    // β Sco (Acrab)
    [243.0, -28.2],
    [246.0, -34.2],
    [248.5, -38.0],    // ε Sco
    [252.0, -39.0],
    [256.0, -37.1],    // Shaula λ
    [258.0, -34.2],    // Lesath υ
  ]},

  // Sagittarius — archer (teapot asterism)
  { iauCode: "Sgr", name: "Sagittarius", nameCn: "人马座", waypoints: [
    [276.04, -34.38],  // Kaus Australis ε
    [284.74, -29.83],  // Nunki σ
    [283.82, -26.30],  // Ascella ζ
    [276.04, -34.38],  // back to ε
    [270.0, -30.4],    // Kaus Media δ
    [268.0, -25.4],    // Kaus Borealis λ
    [276.0, -25.4],    // φ Sgr
    [284.74, -29.83],  // back to Nunki
    [263.4, -34.4],    // Aspidiske φ
  ]},

  // Capricornus — sea goat
  { iauCode: "Cap", name: "Capricornus", nameCn: "摩羯座", waypoints: [
    [313.0, -16.13],   // Deneb Algedi δ
    [319.0, -14.78],   // Nashira γ
    [323.0, -16.67],   // ζ Cap
    [326.75, -9.88],   // Dabih β
    [328.0, -5.0],     // Algedi α
    [326.75, -9.88],   // back to β
    [315.0, -8.3],     // ω Cap
    [313.0, -16.13],   // back to δ
  ]},

  // Aquarius — water bearer
  { iauCode: "Aqr", name: "Aquarius", nameCn: "宝瓶座", waypoints: [
    [331.0, -0.3],     // Sadalmelik α
    [333.0, 1.0],      // β Aqr (Sadalsuud)
    [338.0, -3.3],     // γ Aqr (Sadachbia)
    [345.0, -7.8],     // ζ Aqr
    [348.0, -15.8],    // δ Aqr
    [353.0, -16.2],    // λ Aqr
    [348.0, -15.8],    // back to δ
    [342.0, -14.6],    // τ Aqr
  ]},

  // Pisces — fishes
  { iauCode: "Psc", name: "Pisces", nameCn: "双鱼座", waypoints: [
    [2.0, 2.8],        // η Psc
    [357.0, 3.6],      // γ Psc
    [349.0, 1.0],      // δ Psc
    [344.0, -5.5],     // ε Psc
    [339.0, -6.0],     // ω Psc
    [349.0, 1.0],      // back to δ
    [352.0, 7.6],      // β Psc
    [1.5, 15.3],       // α Psc
    [358.0, 20.5],     // λ Psc
  ]},

  // Ophiuchus — serpent bearer
  { iauCode: "Oph", name: "Ophiuchus", nameCn: "蛇夫座", waypoints: [
    [262.5, 12.56],    // Rasalhague α
    [256.0, 9.5],      // β Oph (Cebalrai)
    [248.0, 4.0],      // γ Oph
    [244.0, -4.7],     // ν Oph
    [248.0, -9.5],     // η Oph (Sabik is at 258, so use η)
    [254.0, -6.0],     // ζ Oph
    [262.5, 12.56],    // back to α
    [258.0, 15.7],     // δ Oph
    [263.0, 4.7],      // ε Oph
  ]},

  // ═══════════════════════════════════════════════════════════
  // SOUTHERN CONSTELLATIONS
  // ═══════════════════════════════════════════════════════════

  // Orion — hunter
  { iauCode: "Ori", name: "Orion", nameCn: "猎户座", waypoints: [
    [88.79, 7.41],     // Betelgeuse α
    [83.0, -1.2],      // Bellatrix γ
    [83.63, -1.94],    // Mintaka δ
    [84.05, -1.2],     // Alnilam ε
    [84.53, -1.2],     // Alnitak ζ
    [85.19, -2.4],     // Saiph κ
    [89.0, -8.2],      // Rigel β
  ]},

  // Canis Major — great dog
  { iauCode: "CMa", name: "Canis Major", nameCn: "大犬座", waypoints: [
    [101.29, -16.72],  // Sirius α
    [95.0, -17.96],    // Mirzam β
    [106.0, -28.97],   // Wezen δ
    [104.7, -23.5],    // γ CMa
    [106.0, -28.97],   // back to Wezen
    [108.0, -26.4],    // ε CMa (Adhara)
    [111.0, -29.3],    // η CMa (Aludra)
  ]},

  // Canis Minor — little dog
  { iauCode: "CMi", name: "Canis Minor", nameCn: "小犬座", waypoints: [
    [111.8, 8.29],     // Procyon α
    [114.0, 3.3],      // Gomeisa β
  ]},

  // Monoceros — unicorn
  { iauCode: "Mon", name: "Monoceros", nameCn: "麒麟座", waypoints: [
    [100.3, -4.87],    // β Mon
    [97.0, -0.5],      // γ Mon
    [94.0, -7.0],      // δ Mon
    [92.0, -3.0],      // ε Mon
    [100.3, -4.87],    // back to β
  ]},

  // Lepus — hare
  { iauCode: "Lep", name: "Lepus", nameCn: "天兔座", waypoints: [
    [81.28, -14.05],   // Arneb α
    [78.64, -20.76],   // Nihal β
    [80.0, -24.0],     // γ Lep
    [83.0, -22.5],     // δ Lep
    [78.64, -20.76],   // back to β
  ]},

  // Columba — dove
  { iauCode: "Col", name: "Columba", nameCn: "天鸽座", waypoints: [
    [82.0, -35.0],     // Phact α
    [79.0, -35.8],     // β Col (Wazn)
    [84.0, -37.5],     // γ Col
    [82.0, -35.0],     // back to α
  ]},

  // Puppis — stern
  { iauCode: "Pup", name: "Puppis", nameCn: "船尾座", waypoints: [
    [122.0, -19.3],    // ζ Pup (Naos)
    [115.0, -15.5],    // π Pup
    [107.0, -13.0],    // τ Pup
    [104.0, -16.5],    // ν Pup
    [110.0, -22.0],    // ξ Pup
    [118.0, -24.0],    // σ Pup
  ]},

  // Vela — sails
  { iauCode: "Vel", name: "Vela", nameCn: "船帆座", waypoints: [
    [131.0, -43.4],    // γ Vel (Suhail al Muhlif)
    [127.0, -47.3],    // δ Vel
    [124.0, -52.8],    // ψ Vel
    [131.0, -43.4],    // back to γ
    [135.0, -46.5],    // λ Vel (Suhail)
    [137.0, -43.4],    // μ Vel
  ]},

  // Carina — keel
  { iauCode: "Car", name: "Carina", nameCn: "船底座", waypoints: [
    [95.99, -52.70],   // Canopus α
    [89.0, -59.3],     // Miaplacidus β
    [96.0, -61.3],     // ε Car (Avior)
    [103.0, -58.0],    // θ Car
    [107.0, -63.5],    // ω Car
    [100.0, -70.0],    // ν Car
  ]},

  // Pyxis — compass
  { iauCode: "Pyx", name: "Pyxis", nameCn: "罗盘座", waypoints: [
    [133.0, -32.0],    // α Pyx
    [130.0, -28.5],    // β Pyx
    [136.0, -29.0],    // γ Pyx
  ]},

  // Centaurus — centaur
  { iauCode: "Cen", name: "Centaurus", nameCn: "半人马座", waypoints: [
    [219.90, -60.37],  // Rigil Kentaurus α
    [215.0, -52.6],    // Hadar β (Agena)
    [210.0, -45.7],    // ε Cen
    [204.0, -36.4],    // ζ Cen
    [197.0, -33.0],    // η Cen
    [200.0, -41.7],    // δ Cen
    [210.0, -45.7],    // back to ε
    [215.0, -42.5],    // γ Cen (Muhlifain)
  ]},

  // Crux — Southern Cross
  { iauCode: "Cru", name: "Crux", nameCn: "南十字座", waypoints: [
    [186.65, -63.10],  // Acrux α
    [191.93, -59.69],  // Mimosa β
    [182.5, -57.1],    // γ Cru (Gacrux)
    [182.5, -58.8],    // δ Cru (Imai)
    [186.65, -63.10],  // back to α
  ]},

  // Lupus — wolf
  { iauCode: "Lup", name: "Lupus", nameCn: "豺狼座", waypoints: [
    [227.0, -47.4],    // α Lup
    [224.0, -44.3],    // β Lup
    [219.0, -43.5],    // γ Lup
    [215.0, -46.4],    // δ Lup
    [224.0, -50.5],    // ε Lup
    [227.0, -47.4],    // back to α
  ]},

  // Circinus — compasses
  { iauCode: "Cir", name: "Circinus", nameCn: "圆规座", waypoints: [
    [221.0, -64.9],    // α Cir
    [224.0, -66.5],    // β Cir
    [218.0, -67.7],    // γ Cir
    [221.0, -64.9],    // back to α
  ]},

  // Triangulum Australe — southern triangle
  { iauCode: "TrA", name: "Triangulum Australe", nameCn: "南三角座", waypoints: [
    [237.0, -69.0],    // Atria α
    [242.0, -63.4],    // β TrA
    [246.0, -68.6],    // γ TrA
    [237.0, -69.0],    // back to α
  ]},

  // Ara — altar
  { iauCode: "Ara", name: "Ara", nameCn: "天坛座", waypoints: [
    [263.0, -50.1],    // β Ara
    [258.0, -50.1],    // α Ara (Choo)
    [252.0, -49.9],    // ζ Ara
    [253.0, -55.5],    // θ Ara
    [260.0, -56.4],    // ε Ara
    [263.0, -50.1],    // back to β
  ]},

  // Corona Australis — southern crown
  { iauCode: "CrA", name: "Corona Australis", nameCn: "南冕座", waypoints: [
    [278.0, -37.0],    // α CrA (Alfecca Meridiana)
    [281.0, -38.5],    // β CrA
    [284.0, -37.0],    // γ CrA
    [282.0, -35.5],    // δ CrA
    [278.0, -37.0],    // back to α
  ]},

  // Pavo — peacock
  { iauCode: "Pav", name: "Pavo", nameCn: "孔雀座", waypoints: [
    [306.5, -56.74],   // Peacock α
    [300.0, -56.0],    // β Pav
    [294.0, -57.8],    // γ Pav
    [299.0, -63.5],    // δ Pav
    [306.5, -56.74],   // back to α
  ]},

  // Grus — crane
  { iauCode: "Gru", name: "Grus", nameCn: "天鹤座", waypoints: [
    [332.0, -46.96],   // Alnair α
    [335.0, -43.5],    // β Gru
    [338.0, -38.5],    // γ Gru
    [335.0, -43.5],    // back to β
    [343.0, -46.9],    // δ Gru
  ]},

  // Phoenix — phoenix
  { iauCode: "Phe", name: "Phoenix", nameCn: "凤凰座", waypoints: [
    [13.0, -42.3],     // Ankaa α
    [17.0, -37.6],     // β Phe
    [23.0, -39.5],     // γ Phe
    [20.0, -44.5],     // δ Phe
    [13.0, -42.3],     // back to α
  ]},

  // Tucana — toucan
  { iauCode: "Tuc", name: "Tucana", nameCn: "杜鹃座", waypoints: [
    [330.5, -62.9],    // α Tuc
    [335.0, -64.9],    // β Tuc
    [337.0, -60.5],    // γ Tuc
  ]},

  // Indus — Indian
  { iauCode: "Ind", name: "Indus", nameCn: "印第安座", waypoints: [
    [320.0, -47.4],    // α Ind (Persian)
    [325.0, -45.2],    // β Ind
    [328.0, -49.0],    // ε Ind
  ]},

  // Eridanus — river
  { iauCode: "Eri", name: "Eridanus", nameCn: "波江座", waypoints: [
    [53.5, -8.8],      // Cursa β
    [48.0, -5.1],      // γ Eri (Zaurak)
    [42.0, -9.8],      // δ Eri (Rana)
    [36.0, -12.5],     // ε Eri
    [28.0, -18.6],     // ζ Eri
    [24.0, -22.5],     // η Eri (Azha)
    [18.0, -29.6],     // θ Eri (Acamar)
    [12.0, -35.0],     // ι Eri
    [4.0, -40.3],      // λ Eri
    [357.0, -43.0],    // ν Eri
    [345.0, -47.0],    // ξ Eri
    [336.0, -51.5],    // ο2 Eri
    [324.0, -56.0],    // τ Eri
    [314.0, -59.8],    // υ2 Eri
    [303.0, -62.0],    // φ Eri
    [291.0, -64.5],    // χ Eri
  ]},

  // Cetus — sea monster
  { iauCode: "Cet", name: "Cetus", nameCn: "鲸鱼座", waypoints: [
    [19.0, 2.98],      // Menkar α
    [12.0, -3.2],      // λ Cet
    [8.0, -10.2],      // μ Cet
    [14.0, -8.8],      // ξ2 Cet
    [24.0, -3.4],      // γ Cet
    [19.0, 2.98],      // back to α
    [31.0, -3.2],      // δ Cet
    [38.0, -17.9],     // Mira ο Cet
    [42.0, -14.6],     // β Cet (Diphda)
  ]},

  // Fornax — furnace
  { iauCode: "For", name: "Fornax", nameCn: "天炉座", waypoints: [
    [53.0, -29.0],     // α For (Dalim)
    [47.0, -30.0],     // β For
    [44.0, -25.5],     // γ For
  ]},

  // Sculptor — sculptor
  { iauCode: "Scl", name: "Sculptor", nameCn: "玉夫座", waypoints: [
    [13.0, -29.4],     // α Scl
    [8.0, -28.4],      // β Scl
    [16.0, -25.5],     // γ Scl
    [13.0, -29.4],     // back to α
  ]},

  // Piscis Austrinus — southern fish
  { iauCode: "PsA", name: "Piscis Austrinus", nameCn: "南鱼座", waypoints: [
    [344.41, -29.62],  // Fomalhaut α
    [348.0, -25.6],    // β PsA
    [352.0, -30.1],    // δ PsA
    [344.41, -29.62],  // back to α
  ]},

  // Hydrus — water snake (small)
  { iauCode: "Hyi", name: "Hydrus", nameCn: "水蛇座", waypoints: [
    [17.0, -61.6],     // α Hyi
    [12.0, -66.1],     // β Hyi
    [22.0, -68.6],     // γ Hyi
  ]},

  // Hydra — water snake (large)
  { iauCode: "Hya", name: "Hydra", nameCn: "长蛇座", waypoints: [
    [139.0, -12.0],    // Alphard α
    [133.0, -8.5],     // σ Hya
    [125.0, -5.0],     // ε Hya
    [117.0, -6.5],     // δ Hya
    [110.0, -1.7],     // γ Hya
    [104.0, -7.5],     // ζ Hya
    [97.0, -14.3],     // η Hya
    [91.0, -16.8],     // θ Hya
    [85.0, -23.4],     // ι Hya
  ]},

  // Corvus — crow
  { iauCode: "Crv", name: "Corvus", nameCn: "乌鸦座", waypoints: [
    [188.0, -24.7],    // γ Crv
    [191.0, -22.6],    // δ Crv (Algorab)
    [186.0, -16.5],    // β Crv (Kraz)
    [182.0, -17.5],    // ε Crv
    [188.0, -24.7],    // back to γ
  ]},

  // Crater — cup
  { iauCode: "Crt", name: "Crater", nameCn: "巨爵座", waypoints: [
    [167.0, -18.3],    // δ Crt
    [170.0, -15.0],    // γ Crt
    [174.0, -18.3],    // α Crt (Alkes)
    [171.0, -23.8],    // β Crt
    [167.0, -18.3],    // back to δ
  ]},

  // Sextans — sextant
  { iauCode: "Sex", name: "Sextans", nameCn: "六分仪座", waypoints: [
    [156.0, -0.7],     // α Sex
    [152.0, -2.0],     // β Sex
    [149.0, 2.0],      // γ Sex
  ]},

  // Scutum — shield
  { iauCode: "Sct", name: "Scutum", nameCn: "盾牌座", waypoints: [
    [278.0, -8.2],     // α Sct
    [275.0, -4.7],     // β Sct
    [281.0, -4.5],     // γ Sct
    [278.0, -8.2],     // back to α
  ]},

  // Serpens — serpent (split into Caput and Cauda)
  { iauCode: "Ser", name: "Serpens", nameCn: "巨蛇座", waypoints: [
    // Serpens Caput (head)
    [236.0, 10.5],     // Unukalhai α
    [232.0, 4.2],      // δ Ser
    [229.0, -0.8],     // ε Ser
    [235.0, -3.5],     // η Ser
    // Serpens Cauda (tail) — separated by Ophiuchus
    [272.0, -2.7],     // ξ Ser
    [269.0, 4.0],      // η Ser (Cauda)
    [265.0, 1.0],      // θ Ser (Alya)
  ]},

  // Antlia — air pump
  { iauCode: "Ant", name: "Antlia", nameCn: "唧筒座", waypoints: [
    [146.0, -31.0],    // α Ant
    [142.0, -35.3],    // ε Ant
    [148.0, -35.8],    // ι Ant
  ]},

  // Musca — fly
  { iauCode: "Mus", name: "Musca", nameCn: "苍蝇座", waypoints: [
    [197.0, -69.1],    // α Mus
    [202.0, -68.1],    // β Mus
    [194.0, -72.1],    // γ Mus
    [197.0, -69.1],    // back to α
  ]},

  // Apus — bird of paradise
  { iauCode: "Aps", name: "Apus", nameCn: "天燕座", waypoints: [
    [259.0, -79.3],    // α Aps
    [253.0, -77.0],    // γ Aps
    [247.0, -73.4],    // δ Aps
  ]},

  // Chamaeleon — chameleon
  { iauCode: "Cha", name: "Chamaeleon", nameCn: "蝘蜓座", waypoints: [
    [127.0, -77.0],    // α Cha
    [131.0, -79.2],    // β Cha
    [135.0, -76.4],    // γ Cha
    [127.0, -77.0],    // back to α
  ]},

  // Octans — octant
  { iauCode: "Oct", name: "Octans", nameCn: "南极座", waypoints: [
    [326.0, -89.2],    // σ Oct (near south celestial pole)
    [321.0, -86.2],    // ν Oct
    [336.0, -85.0],    // β Oct
  ]},

  // Volans — flying fish
  { iauCode: "Vol", name: "Volans", nameCn: "飞鱼座", waypoints: [
    [129.0, -69.5],    // α Vol
    [133.0, -68.6],    // β Vol
    [125.0, -71.0],    // γ Vol
    [129.0, -69.5],    // back to α
  ]},

  // Dorado — dolphinfish
  { iauCode: "Dor", name: "Dorado", nameCn: "剑鱼座", waypoints: [
    [76.0, -55.0],     // α Dor
    [82.0, -56.2],     // β Dor
    [87.0, -59.5],     // γ Dor
    [76.0, -55.0],     // back to α
  ]},

  // Mensa — table mountain
  { iauCode: "Men", name: "Mensa", nameCn: "山案座", waypoints: [
    [84.0, -77.5],     // α Men
    [79.0, -76.0],     // β Men
    [88.0, -79.5],     // γ Men
  ]},

  // Reticulum — reticle
  { iauCode: "Ret", name: "Reticulum", nameCn: "网罟座", waypoints: [
    [60.0, -62.5],     // α Ret
    [64.0, -63.0],     // β Ret
    [56.0, -65.0],     // ε Ret
    [60.0, -62.5],     // back to α
  ]},

  // Horologium — clock
  { iauCode: "Hor", name: "Horologium", nameCn: "时钟座", waypoints: [
    [42.0, -60.0],     // α Hor
    [46.0, -56.5],     // β Hor
    [38.0, -57.5],     // γ Hor
  ]},

  // Norma — rule/square
  { iauCode: "Nor", name: "Norma", nameCn: "矩尺座", waypoints: [
    [244.0, -49.5],    // γ2 Nor
    [240.0, -46.0],    // ε Nor
    [248.0, -47.5],    // η Nor
  ]},

  // Pictor — painter's easel
  { iauCode: "Pic", name: "Pictor", nameCn: "绘架座", waypoints: [
    [97.0, -51.8],     // α Pic
    [102.0, -48.6],    // β Pic
    [93.0, -50.0],     // γ Pic
  ]},

  // Caelum — chisel
  { iauCode: "Cae", name: "Caelum", nameCn: "雕具座", waypoints: [
    [72.0, -41.8],     // α Cae
    [68.0, -44.6],     // β Cae
    [75.0, -44.0],     // γ Cae
  ]},

  // Telescopium — telescope
  { iauCode: "Tel", name: "Telescopium", nameCn: "望远镜座", waypoints: [
    [279.0, -45.5],    // α Tel
    [283.0, -51.5],    // β Tel
    [275.0, -50.0],    // γ Tel
  ]},

  // Microscopium — microscope
  { iauCode: "Mic", name: "Microscopium", nameCn: "显微镜座", waypoints: [
    [315.0, -37.0],    // γ Mic
    [319.0, -33.5],    // α Mic
    [312.0, -32.5],    // ε Mic
  ]},

];
