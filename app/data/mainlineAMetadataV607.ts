import { CONSTELLATION_LINES } from "./constellationCatalog";
import { NEBULAE } from "./nebulaCatalog";
import { STELLAR_HEROES_V592 } from "./stellarHeroesV592.generated";
import { MAINLINE_A1_IAU_BOUNDARIES } from "./mainlineAConstellationBoundaryDataV607";
import { MAINLINE_A_CURRENT_IAU_BOUNDARIES } from "./mainlineAConstellationCurrentBoundaryDataV607";
import { MAINLINE_A3_NEBULA_ASSET_CANDIDATES } from "./mainlineAFirstSetNebulaCandidatesV607";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "./mainlineANebulaVisualAssetsV607.all.generated";
import { MAINLINE_A4_CURRENT_STELLAR_EVIDENCE, MAINLINE_A_BETA_REFERENCE_READY_IDS } from "./mainlineAStellarEvidenceV607";
import { MAINLINE_A_BETA_STELLAR_NARRATIVES } from "./mainlineABetaStellarNarrativesV607";
import type { ConstellationMetadataV607, NebulaMetadataV607WithEncoding, ProvenanceV607, StarMetadataV607WithArtDirection } from "../lib/celestialObjectContractV607";
import { MAINLINE_A_WEB_NEBULA_PREVIEWS_V648, mainlineAWebNebulaPreviewV648 } from "../lib/mainlineAWebNebulaPreviewV648";

const retrievedAt = "2026-09-09";
const IAU: ProvenanceV607 = { sourceId: "iau-constellations", sourceUrl: "https://www.iau.org/Iau/Iau/Science/What-we-do/The-Constellations.aspx", retrievedAt, license: "source-attribution-required", credit: "International Astronomical Union" };
const NASA_CONSTELLATIONS: ProvenanceV607 = { sourceId: "nasa-constellation-season-guide", sourceUrl: "https://spaceplace.nasa.gov/constellations/en/", retrievedAt, license: "source-attribution-required", credit: "NASA Space Place" };
const GAIA: ProvenanceV607 = { sourceId: "gaia-dr3-source", sourceUrl: "https://gea.esac.esa.int/archive/documentation/GDR3/Gaia_archive/chap_datamodel/sec_dm_main_source_catalogue/ssec_dm_gaia_source.html", retrievedAt, license: "catalogue-terms-review" };
const HUBBLE: ProvenanceV607 = { sourceId: "esa-hubble-nebula-archive", sourceUrl: "https://esahubble.org/images/archive/category/nebulae/", retrievedAt, license: "verify-per-image", credit: "ESA/Hubble" };
const M42_SOURCE: ProvenanceV607 = { sourceId: "esa-hubble-opo0205d", sourceUrl: "https://esahubble.org/images/opo0205d/", retrievedAt, license: "CC BY 4.0", credit: "NASA/ESA and C.R. O'Dell (Vanderbilt University)" };
const M1_SOURCE: ProvenanceV607 = { sourceId: "esa-hubble-potw1644a", sourceUrl: "https://esahubble.org/images/potw1644a/", retrievedAt, license: "CC BY 4.0", credit: "ESA/Hubble & NASA. Acknowledgement: Judy Schmidt (Geckzilla)" };
const M1_DISTANCE_SOURCE: ProvenanceV607 = { sourceId: "nasa-messier-1-distance", sourceUrl: "https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-1/", retrievedAt, license: "source-attribution-required", credit: "NASA Science / Hubble Messier Catalog; distance 6,500 light-years (approximately 2,000 pc)" };
const M8_SOURCE: ProvenanceV607 = { sourceId: "esa-hubble-heic1517b", sourceUrl: "https://esahubble.org/images/heic1517b/", retrievedAt, license: "CC BY 4.0", credit: "NASA, ESA, Digitized Sky Survey 2 (Acknowledgement: Davide De Martin)" };
const M16_SOURCE: ProvenanceV607 = { sourceId: "esa-hubble-heic1501e", sourceUrl: "https://esahubble.org/images/heic1501e/", retrievedAt, license: "CC BY 4.0", credit: "ESO/Digitized Sky Survey 2. Acknowledgment: Davide De Martin." };
const M20_SOURCE: ProvenanceV607 = { sourceId: "esa-hubble-opo0417c", sourceUrl: "https://esahubble.org/images/opo0417c/", retrievedAt, license: "CC BY 4.0", credit: "NASA, ESA, and The Hubble Heritage Team (AURA/STScI)" };
const M57_SOURCE: ProvenanceV607 = { sourceId: "esa-hubble-heic1310a", sourceUrl: "https://esahubble.org/images/heic1310a/", retrievedAt, license: "CC BY 4.0", credit: "NASA, ESA, and C. Robert O’Dell (Vanderbilt University)." };

const constellationCodes = ["Ori", "UMa", "Cas", "Sco"] as const;
const currentConstellationCodes = ["Cyg", "Gem", "Leo", "Cru", "Lyr", "Aql", "Tau", "Sgr"] as const;
export const MAINLINE_A_CURRENT_CONSTELLATION_CODES = ["Ori", "UMa", "Cas", "Sco", ...currentConstellationCodes] as const;
const nebulaIds = ["m42", "m1", "m8", "m16", "m20", "m57", "ngc7293", "ngc6543", "ngc2237", "ngc6960", "carina", "b33"] as const;
/**
 * The six-object A1 handoff remains frozen for historical receipts.  The
 * current art roster is additive so new portraits can be audited without
 * rewriting the original first-set counts.
 */
const firstSetStarIds = ["alpha-centauri-a", "achernar", "betelgeuse", "sirius-a", "rigel", "antares"] as const;
const currentStarIds = [
  ...firstSetStarIds,
  "canopus",
  "arcturus",
  "vega",
  "capella-a",
  "procyon-a",
  "aldebaran",
  ...MAINLINE_A_BETA_REFERENCE_READY_IDS,
] as const;
const constellationNarratives: Record<string, { summaryCn: string; detailCn: string }> = {
  Ori: { summaryCn: "冬季最醒目的赤道星座", detailCn: "猎户座以参宿四、参宿七和腰带三星构成辨识度最高的星官结构；M42 位于腰带南侧剑鞘区域，是后续星云联动的首个入口。" },
  UMa: { summaryCn: "大熊座中的北斗七星", detailCn: "北斗七星是大熊座的一部分，四星组成斗口、三星延伸为斗柄。天璇至天枢的连线可帮助寻找北极星。能否整夜可见取决于观测纬度；星图中的实线表示习惯连线，虚线显示完整的大熊座边界。" },
  Cas: { summaryCn: "银河北部的 W 形星座", detailCn: "仙后座的五颗主星形成明显 W 形，位于银河系高密度背景中，适合作为星场方向和恒星标签的对照样本。" },
  Sco: { summaryCn: "黄道附近的蝎形夏季星座", detailCn: "天蝎座沿银河系方向展开，心宿二提供醒目的红色恒星锚点；后续阶段将把它与邻近发射星云建立观测联动。" },
  Cyg: { summaryCn: "银河系中的北十字星座", detailCn: "天鹅座沿银河平面延伸，北十字的长轴把高密度星场与方向导航连接起来；连线仍是观测图示，不代表恒星间的物理结构。" },
  Gem: { summaryCn: "黄道附近的双子座", detailCn: "双子座以 Castor 与 Pollux 为醒目锚点，适合展示近邻恒星与黄道区域的方向关系；边界采用 IAU J2000 来源。" },
  Leo: { summaryCn: "春季黄道上的狮子座", detailCn: "狮子座的镰刀形星群与轩辕十四构成春季识别锚点；图示强调天空方向，不推断星群的共同距离或物理联系。" },
  Cru: { summaryCn: "南天导航中的南十字座", detailCn: "南十字座以短而清晰的十字形成为南天导航标志；当前边界和连线用于观测展示，季节提示不替代真实地平线计算。" },
  Lyr: { summaryCn: "夏季银河中的天琴座", detailCn: "天琴座以织女星为亮度锚点，适合展示高温亮星与银河背景的方向关系；边界使用 IAU J2000 来源。" },
  Aql: { summaryCn: "银河赤道附近的天鹰座", detailCn: "天鹰座沿银河平面展开，河鼓二是醒目的导航恒星；图示只表达天空方向，不推断恒星物理关联。" },
  Tau: { summaryCn: "黄道北部的金牛座", detailCn: "金牛座包含毕宿五与昴宿星团方向，是黄道区域和前景恒星距离差异的对照样本。" },
  Sgr: { summaryCn: "指向银河系中心的人马座", detailCn: "人马座横跨银河系中心方向，适合连接密集星场与星云观测路线；连线不代表恒星间物理结构。" },
};
const constellationPresentation: Record<string, { seasonCn: string; representativeStars: readonly string[] }> = {
  Ori: { seasonCn: "冬季（北半球晚秋至早春最醒目）", representativeStars: ["Betelgeuse / 参宿四", "Rigel / 参宿七", "Bellatrix / 参宿五", "Orion's Belt / 猎户座腰带三星"] },
  UMa: { seasonCn: "春季傍晚最醒目；北半球较高纬度可全年见到北斗，低纬度会部分落下", representativeStars: ["Dubhe / 天枢", "Merak / 天璇", "Phecda / 天玑", "Megrez / 天权", "Alioth / 玉衡", "Mizar / 开阳", "Alkaid / 摇光"] },
  Cas: { seasonCn: "秋季至冬季（北半球高纬度全年可见）", representativeStars: ["Schedar / 王良四", "Caph / 王良一", "Gamma Cassiopeiae / 策", "Ruchbah / 阁道三"] },
  Sco: { seasonCn: "夏季（南方天空；北半球中低纬度最醒目）", representativeStars: ["Antares / 心宿二", "Shaula / 尾宿八", "Dschubba / 房宿三", "Sargas / 尾宿五"] },
  Cyg: { seasonCn: "夏季银河最醒目；北半球中高纬度可见", representativeStars: ["Deneb / 天津四", "Sadr / 天津一", "Gienah / 天津九", "Albireo / 辇道增七"] },
  Gem: { seasonCn: "冬季傍晚最醒目", representativeStars: ["Pollux / 北河三", "Castor / 北河二", "Alhena / 天樽三", "Mebsuta / 井宿一"] },
  Leo: { seasonCn: "春季傍晚最醒目", representativeStars: ["Regulus / 轩辕十四", "Denebola / 五帝座一", "Algieba / 轩辕二", "Zosma / 五帝座三"] },
  Cru: { seasonCn: "南半球秋季至冬季最醒目", representativeStars: ["Acrux / 十字架二", "Mimosa / 十字架三", "Gacrux / 十字架一", "Imai / 十字架四"] },
  Lyr: { seasonCn: "夏季银河最醒目", representativeStars: ["Vega / 织女星", "Sheliak / 渐台二", "Sulafat / 渐台三"] },
  Aql: { seasonCn: "夏季银河最醒目", representativeStars: ["Altair / 河鼓二", "Tarazed / 河鼓一", "Alshain / 河鼓三"] },
  Tau: { seasonCn: "冬季黄道区域最醒目", representativeStars: ["Aldebaran / 毕宿五", "Elnath / 五车五", "Pleiades / 昴宿星团"] },
  Sgr: { seasonCn: "夏季南方天空最醒目", representativeStars: ["Kaus Australis / 羽林军二", "Nunki / 宿一", "Kaus Media / 羽林军一"] },
};
const nebulaNarratives: Record<string, { summaryCn: string; detailCn: string }> = {
  m42: { summaryCn: "猎户座中的恒星形成区", detailCn: "M42 是明亮的电离氢区，核心的四边形星团照亮周围气体；展示层将把粉红发射色作为 Hα 主导的视觉提示，而不是光谱定量结果。" },
  m1: { summaryCn: "超新星遗迹与蟹状脉冲星的外壳", detailCn: "M1 的丝状结构来自超新星爆发后的冲击波，中心脉冲星向周围注入能量；适合与脉冲星目录做跨对象联动。" },
  m8: { summaryCn: "银河系内的巨大电离氢区", detailCn: "礁湖星云由年轻恒星的紫外辐射激发，暗带把发射区切成层次分明的结构；颜色和亮度仍是展示代理。" },
  m16: { summaryCn: "鹰状星云中的柱状尘埃结构", detailCn: "M16 的尘埃柱位于活跃恒星形成区，气体被强烈辐射雕刻；纹理可强调柱体轮廓，但不应暗示三维深度已被直接测量。" },
  m20: { summaryCn: "发射、反射与暗尘埃交叠的三叶星云", detailCn: "M20 同时包含发射气体、反射尘埃和遮蔽尘带，三种成分共同形成三叶外观；适合作为多波段解释的示范对象。" },
  m57: { summaryCn: "由晚期恒星外层抛出的行星状星云", detailCn: "环状星云是膨胀气壳与中心白矮星的组合，环形外观来自壳层几何和视线方向；不是行星系统。" },
  ngc7293: { summaryCn: "距离较近、角尺寸较大的行星状星云", detailCn: "螺旋星云展示了恒星演化末期抛射物的多壳层结构；大角径与较近距离使它适合做尺度对照。" },
  ngc6543: { summaryCn: "具有复杂内壳层的猫眼星云", detailCn: "猫眼星云的同心壳层和细丝适合展示高对比度结构；当前目录只承载位置、距离和角径，不推断完整三维形态。" },
  ngc2237: { summaryCn: "被年轻星团照亮的玫瑰形恒星形成区", detailCn: "玫瑰星云的环状发射区围绕中心低密度空腔，边缘气体受到年轻恒星辐射激发；可作为大角尺寸 H II 区的代表。" },
  ngc6960: { summaryCn: "天鹅座中的超新星遗迹丝网", detailCn: "面纱星云的细长丝状结构是冲击波扫过稀薄介质的结果；多波段颜色应标注为成像编码而非肉眼颜色。" },
  carina: { summaryCn: "包含巨型恒星与强烈反馈的船底座星云", detailCn: "船底座大星云拥有大质量年轻恒星和复杂尘埃云，适合展示恒星反馈如何塑造发射区；距离和角径采用目录近似值。" },
  b33: { summaryCn: "嵌在 IC 434 背景中的冷暗尘埃云", detailCn: "B33 通过遮挡后方发射区形成马头轮廓，暗色来自消光而非自身发光；展示层必须保留这一‘剪影’语义。" },
};
const starNarratives: Record<string, { summaryCn: string; detailCn: string }> = {
  "alpha-centauri-a": { summaryCn: "最近邻恒星系统中的太阳型主星", detailCn: "半人马座 α A 是与太阳相近的 G 型主序星，与 α B 组成近邻双星，适合对照太阳型光球的色温、光度和尺度。肖像使用温度与光度参数生成颗粒状外观；这些纹理不表示观测到了逐个对流胞。下方把场景目录距离与 SIMBAD 视差派生参考并列保留；Gaia 位置近邻记录尚未确认为同一恒星。" },
  achernar: { summaryCn: "高速自转导致明显扁率的蓝白恒星", detailCn: "水委一是快速自转的 B 型发射线恒星：赤道隆起与重力昏暗会使极区和赤道具有不同的温度。无盘期干涉观测的旋转模型给出极半径、赤道半径与倾角，适合解释恒星并非总能用球体表达。下方文献误差属于该模型；当前肖像的单一色温与等效半径是展示参数，不能混作同一测量。" },
  betelgeuse: { summaryCn: "猎户座中的红超巨星", detailCn: "参宿四是猎户座肩部的红超巨星，与蓝色的参宿七形成醒目的温度对照。它已离开主序阶段，扩展而较冷的外层和可变亮度让半径、光度与距离的解释依赖观测和模型。肖像的大片对流纹理与红橙色表达这种尺度印象；目录采用的 200 pc 与下方视差派生参考来自不同整理路径，不能把后者误差直接套在前者上。" },
  "sirius-a": { summaryCn: "夜空中视亮度最高的恒星", detailCn: "天狼星 A 是明亮的 A 型主序星，与白矮星天狼星 B 构成双星。它离太阳很近，因此很高的视亮度并不等于它比远方超巨星具有更大的本征光度。肖像用蓝白色表现较高温度，远景仍保持点源语义。卡片中的 V 波段星等来自具名恒星目录；Gaia 渲染锚点的 G 波段属于另一个条目，不能替代它。" },
  rigel: { summaryCn: "猎户座的蓝超巨星", detailCn: "参宿七位于猎户座的一足，是高光度的 B 型蓝超巨星；它比参宿四更热，而肉眼视亮度仍受到距离影响。蓝白光球与温度驱动的辐射外观适合对照红超巨星的低温大尺度表面。目录光度与温度只是当前肖像的输入，半径由它们计算；没有输入误差时，画面精细程度不能代表半径测量精度。" },
  antares: { summaryCn: "天蝎座的红超巨星心宿二", detailCn: "心宿二是天蝎座中央醒目的红超巨星，位于银河系密集背景中。较冷的扩展外层形成红橙色印象，变星标识与伴星资料则提醒我们：单一颜色或一个星等不足以描述这个系统。肖像保留温度和尺度差异，参考区给出视差的一阶传播误差；恒星表面结构、变化周期和伴星轨道不会从静态艺术纹理中反推。" },
  canopus: { summaryCn: "船底座中耀眼的浅色亮巨星", detailCn: "老人星（Canopus）是南天最醒目的亮星之一，目录将它标为 A9 II 型亮巨星。较高的视亮度来自本征光度与距离的共同作用，不能只用画面大小比较恒星真实半径。肖像以高色温、扩展光球和克制的辐射晕表达它在天空中的导航权重；Gaia 条目仅作位置渲染锚点，未被用来确认具名恒星身份。" },
  arcturus: { summaryCn: "牧夫座的橙色巨星大角星", detailCn: "大角星（Arcturus）是 K 型巨星，较低色温使它呈现暖橙色，是北天星图中很好的颜色对照。巨星的扩展半径与较近目录距离共同形成很高的视亮度，但参数化肖像的半径、光度和颗粒纹理只用于解释层。SIMBAD 视差提供独立参考；Gaia source_id 仍是渲染锚点，不能把渲染值当作这颗具名恒星的测量。" },
  vega: { summaryCn: "天琴座中用于校准天空亮度感的白色亮星", detailCn: "织女星（Vega）是 A0 V 型恒星，也是传统光度系统中的重要参照。它的快速自转和可能的扁率适合用轻微的参数化椭圆光球提示，但当前视图没有按观测倾角重建表面。肖像只消费目录色温、半径和光度输入；来源参考的视差与 Gaia 渲染锚点分层保留，不能互相替代。" },
  "capella-a": { summaryCn: "五车二系统中被单独展示的 A 组件", detailCn: "五车二（Capella）是一个多星系统；本卡以 Capella A 作为展示组件，使用 G 型巨星的目录参数生成光球示意。SIMBAD 当前快照按系统级名称解析，组件 A 的身份与测量应保持谨慎，因此 Gaia 条目只承担位置渲染锚点，不能据此宣称组件确认。伴星关系来自英雄目录的系统备注，未在本卡中模拟轨道。" },
  "procyon-a": { summaryCn: "南河三系统中的暖色次巨星组件", detailCn: "南河三 A（Procyon A）是 F5 IV–V 型恒星，与白矮星 Procyon B 构成近邻系统。它的暖白色调和接近太阳的尺度适合连接‘主序末端到次巨星’的解释路线；肖像仍是参数化光球，不代表观测表面或真实双星轨道。SIMBAD 的 exact-component 记录支持组件级参考，而 Gaia source_id 仍只作为渲染锚点，未写回科学状态。" },
  aldebaran: { summaryCn: "金牛座前景中的橙色巨星毕宿五", detailCn: "毕宿五（Aldebaran）是 K5 III 型橙色巨星，位于金牛座方向并常被用作毕星团视线中的参照。天空方向上的接近不等于与星团同距；卡片用目录距离和角位置保持导航语义，用较低色温与扩展光球提供视觉对照。SIMBAD 视差是文献编纂参考，Gaia 条目只用于位置锚定，未经具名恒星身份确认。" },
};

export const MAINLINE_A1_CONSTELLATIONS: ConstellationMetadataV607[] = constellationCodes.map((code) => {
  const row = CONSTELLATION_LINES.find((item) => item.iauCode === code);
  if (!row) throw new Error(`Missing constellation ${code}`);
  const narrative = constellationNarratives[code];
  const presentation = constellationPresentation[code];
  const boundaryVertices = MAINLINE_A1_IAU_BOUNDARIES[code] ?? [];
  const boundary = boundaryVertices.map((vertex) => [vertex.raDeg, vertex.decDeg] as [number, number]);
  const boundarySource: ProvenanceV607 = { ...IAU, sourceId: `iau-boundary-${code}`, sourceUrl: `https://iauarchive.eso.org/static/public/constellations/txt/${code.toLowerCase()}.txt`, credit: "International Astronomical Union / Eugène Delporte boundaries" };
  const relatedObjectIds = code === "Ori" ? ["m42", "betelgeuse", "rigel"] : code === "Sco" ? ["antares"] : [];
  return { id: code, kind: "constellation", displayName: row.name, nameEn: row.name, nameCn: row.nameCn, visibleSeasonCn: presentation.seasonCn, representativeStars: presentation.representativeStars, science: { coordinateFrame: "ICRS-J2000" }, presentation: { visualMode: "line", assetStatus: "catalog-marker", confidence: "catalog-derived", rightsStatus: "not-applicable" }, narrative: { titleCn: row.nameCn, summaryCn: narrative.summaryCn, detailCn: narrative.detailCn, caveatsCn: ["连线是星座图示；正式边界使用 IAU J2000 坐标源。"] }, provenance: [IAU, NASA_CONSTELLATIONS, boundarySource], relatedObjectIds, asterismWaypointsJ2000: row.waypoints, boundaryJ2000: boundary.length >= 3 ? [boundary] : [], boundaryStatus: boundary.length >= 3 ? "available" : "pending-source" };
});

/** Additive current constellation roster; A1's four-object snapshot stays frozen. */
export const MAINLINE_A_CURRENT_CONSTELLATIONS: ConstellationMetadataV607[] = [
  ...MAINLINE_A1_CONSTELLATIONS,
  ...currentConstellationCodes.map((code): ConstellationMetadataV607 => {
    const row = CONSTELLATION_LINES.find((item) => item.iauCode === code);
    if (!row) throw new Error(`Missing constellation ${code}`);
    const narrative = constellationNarratives[code];
    const presentation = constellationPresentation[code];
    const vertices = MAINLINE_A_CURRENT_IAU_BOUNDARIES[code] ?? [];
    const boundary = vertices.map((vertex) => [vertex.raDeg, vertex.decDeg] as [number, number]);
    const boundarySource: ProvenanceV607 = { ...IAU, sourceId: `iau-boundary-${code}`, sourceUrl: `https://iauarchive.eso.org/static/public/constellations/txt/${code.toLowerCase()}.txt`, credit: "International Astronomical Union / Eugène Delporte boundaries" };
    return { id: code, kind: "constellation", displayName: row.name, nameEn: row.name, nameCn: row.nameCn, visibleSeasonCn: presentation.seasonCn, representativeStars: presentation.representativeStars, science: { coordinateFrame: "ICRS-J2000" }, presentation: { visualMode: "line", assetStatus: "catalog-marker", confidence: "catalog-derived", rightsStatus: "not-applicable" }, narrative: { titleCn: row.nameCn, summaryCn: narrative.summaryCn, detailCn: narrative.detailCn, caveatsCn: ["连线是星座图示；正式边界使用 IAU J2000 坐标源。"] }, provenance: [IAU, NASA_CONSTELLATIONS, boundarySource], relatedObjectIds: [], asterismWaypointsJ2000: row.waypoints, boundaryJ2000: boundary.length >= 3 ? [boundary] : [], boundaryStatus: boundary.length >= 3 ? "available" : "pending-source" };
  }),
];

export const MAINLINE_A1_NEBULAE: NebulaMetadataV607WithEncoding[] = nebulaIds.map((id) => {
  const row = NEBULAE.find((item) => item.id === id);
  if (!row) throw new Error(`Missing nebula ${id}`);
  const narrative = nebulaNarratives[id];
  const relatedObjectIds = row.id === "m42" ? ["Ori", "betelgeuse", "rigel"] : [];
  const relatedCatalogIds = row.id === "m1" ? ["pulsar:b0531+21"] : [];
  const sourceCandidate = MAINLINE_A3_NEBULA_ASSET_CANDIDATES.find((candidate) => candidate.objectId === row.id);
  const provenance = row.id === "m42" ? [M42_SOURCE] : row.id === "m1" ? [M1_SOURCE, M1_DISTANCE_SOURCE] : row.id === "m8" ? [M8_SOURCE] : row.id === "m16" ? [M16_SOURCE] : row.id === "m20" ? [M20_SOURCE] : row.id === "m57" ? [M57_SOURCE] : [HUBBLE];
  return { id: row.id, kind: "nebula", displayName: row.commonName, catalogName: row.catalogName, nebulaKind: row.kind, science: { coordinateFrame: "galactic", galLonDeg: row.galLonDeg, galLatDeg: row.galLatDeg, distancePc: row.distancePc, angularSizeArcmin: row.sizeArcmin }, presentation: { visualMode: sourceCandidate ? "texture" : "marker", ...(sourceCandidate?.imageId ? { assetId: sourceCandidate.imageId } : {}), assetStatus: sourceCandidate ? "licensed" : "catalog-marker", palette: row.color, confidence: "catalog-derived", rightsStatus: sourceCandidate?.rightsStatus ?? "verify-per-image" }, narrative: { titleCn: row.subtitleCn, summaryCn: narrative.summaryCn, detailCn: `${narrative.detailCn} 目录距离约 ${row.distancePc} pc，角径约 ${row.sizeArcmin}′。`, caveatsCn: [sourceCandidate ? "观测图已按 ESA/Hubble CC BY 4.0 逐图核验，展示与导出须保留完整署名。" : "纹理来源与授权需逐图核验。", "颜色来自观测波段映射或目录展示配色，不代表肉眼颜色，也不是光谱反演结果。"] }, observationEncoding: { bands: sourceCandidate?.observationEncoding.bands ?? [], colorPolicy: sourceCandidate?.observationEncoding.colorPolicy ?? "catalog-marker-palette-not-observation-band", nakedEyeRepresentationClaimed: false, scienceModePolicy: sourceCandidate?.observationEncoding.scienceModePolicy ?? "catalog-marker-coordinate-angular-extent-and-band-only", cinematicModePolicy: sourceCandidate?.observationEncoding.cinematicModePolicy ?? "pending-licensed-observation-image" }, provenance, relatedObjectIds, relatedCatalogIds };
});

function createMainlineStars(ids: readonly string[]): StarMetadataV607WithArtDirection[] {
  return ids.map((id) => {
  type HeroRecord = Record<string, unknown> & { id: string; name: string; gaiaSourceId?: string; gaiaCrossmatchStatus?: string; apparentMagnitudeV?: number; temperatureK?: number; radiusSolar?: number; luminositySolar?: number; equatorialPolarRadiusRatio?: number; shaderProfile?: string; raDeg?: number; decDeg?: number; distancePc?: number; spectralType?: string };
  const row = (STELLAR_HEROES_V592 as readonly HeroRecord[]).find((item) => item.id === id);
  if (!row) throw new Error(`Missing stellar hero ${id}`);
  const narrative = starNarratives[id] ?? MAINLINE_A_BETA_STELLAR_NARRATIVES[id];
  if (!narrative) throw new Error(`Missing stellar narrative ${id}`);
  const evidence = MAINLINE_A4_CURRENT_STELLAR_EVIDENCE[id];
  if (!evidence) throw new Error(`Missing stellar evidence ${id}`);
  const relatedObjectIds = MAINLINE_A_BETA_STELLAR_NARRATIVES[id]?.relatedObjectIds ?? (id === "betelgeuse" || id === "rigel" ? ["Ori", "m42"] : id === "antares" ? ["Sco"] : []);
  const gaiaSourceId = String(row.gaiaSourceId ?? "");
  const raDeg = Number(row.raDeg);
  const decDeg = Number(row.decDeg);
  const distancePc = Number(row.distancePc);
  const spectralType = String(row.spectralType ?? "");
  const apparentMagnitudeV = Number(row.apparentMagnitudeV);
  const temperatureK = Number(row.temperatureK);
  const radiusSolar = Number(row.radiusSolar);
  const luminositySolar = Number(row.luminositySolar);
  const equatorialPolarRadiusRatio = Number(row.equatorialPolarRadiusRatio ?? 1);
  return {
    id,
    kind: "star",
    displayName: String(row.name),
    gaiaSourceId,
    apparentMagnitudeV,
    temperatureK,
    science: { coordinateFrame: "ICRS-J2000", raDeg, decDeg, distancePc, spectralType },
    presentation: { visualMode: "photosphere", assetStatus: "catalog-marker", confidence: "illustrative", rightsStatus: "not-applicable" },
    artDirection: { shaderProfile: String(row.shaderProfile ?? "parametric-photosphere"), colorTemperatureK: temperatureK, radiusSolar, luminositySolar, equatorialPolarRadiusRatio, representation: "parametric-photosphere" },
    evidence,
    factLayers: {
      observed: [
        `SIMBAD 编纂视差：${evidence.referenceDistance.parallaxMas} mas（上游 ${evidence.referenceDistance.upstreamBibcode}）`,
        "该资料是文献汇编参考；尚未取得这颗具名恒星经身份确认的 Gaia 测量与误差。",
      ],
      catalogDerived: [
        `ICRS-J2000 坐标：RA ${raDeg}°，Dec ${decDeg}°（目录整理值）`,
        `目录 V 波段视星等（Johnson V）：${apparentMagnitudeV}（测光误差未记录；不属于 Gaia G/BP/RP 测光）`,
        `目录距离：${distancePc} pc；光谱型：${spectralType}`,
        `Gaia DR3 source_id：${gaiaSourceId}（${evidence.gaiaAssociation.status === "positional-candidate" ? "位置候选，身份未确认" : "渲染锚点，非具名恒星身份"}）`,
      ],
      model: [
        `参数化光球色温：${temperatureK} K`,
        `参数化半径：${radiusSolar} R☉；光度：${luminositySolar} L☉；赤道/极半径比：${equatorialPolarRadiusRatio}`,
      ],
      artisticInference: [
        "颜色、尺度与扁率是由参数驱动的视觉提示，不是解析表面或光谱图像。",
        narrative.summaryCn,
      ],
    },
    narrative: { titleCn: String(row.name), summaryCn: narrative.summaryCn, detailCn: narrative.detailCn, caveatsCn: ["展示模型不是观测纹理，也不替代 Gaia 测量。", "Gaia 关联标识未构成具名恒星身份确认；误差未提供的字段不能视为精确值。"] },
    provenance: [GAIA, ...evidence.sources],
    relatedObjectIds,
  };
  });
}

/** Historical six-star A1 projection; keep its count stable for old receipts. */
export const MAINLINE_A1_STARS: StarMetadataV607WithArtDirection[] = createMainlineStars(firstSetStarIds);

/** Current additive hero roster used by the art expansion and runtime registry. */
export const MAINLINE_A_CURRENT_STARS: StarMetadataV607WithArtDirection[] = createMainlineStars(currentStarIds);

/** Current A3 runtime metadata: twelve local review previews, zero rights signatures. */
export const MAINLINE_A3_NEBULAE: NebulaMetadataV607WithEncoding[] = MAINLINE_A1_NEBULAE.map((nebula) => {
  const asset = MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL.find((candidate) => candidate.objectId === nebula.id);
  const preview = mainlineAWebNebulaPreviewV648(nebula.id);
  if (!MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.valid || !asset || !preview?.available || preview.localSha256 !== asset.sha256) {
    return { ...nebula,
      presentation: { ...nebula.presentation, visualMode: "marker", assetId: undefined,
        assetStatus: "catalog-marker", rightsStatus: "verify-per-image" },
      narrative: { ...nebula.narrative, caveatsCn: [
        "本地观测图与 canonical 来源或权利记录未闭合；仅显示目录标记。",
        ...nebula.narrative.caveatsCn.filter((caveat) => !caveat.includes("逐图核验")),
      ] },
    };
  }
  const source: ProvenanceV607 = {
    sourceId: asset.imageId,
    sourceUrl: asset.sourcePage,
    retrievedAt: asset.retrievedAt.slice(0, 10),
    license: asset.license,
    credit: asset.credit,
  };
  return {
    ...nebula,
    presentation: { ...nebula.presentation, visualMode: "texture", assetId: asset.imageId,
      assetStatus: "manifest-candidate", rightsStatus: "pending-human-signoff" },
    provenance: [source, ...nebula.provenance.filter((prior) => prior.sourceUrl !== source.sourceUrl)],
    narrative: { ...nebula.narrative, caveatsCn: [
      "来源页面、许可标记与完整署名已记录；逐图版权签署 pending，本地图片仅供候选视觉审阅。",
      "颜色来自观测波段映射，不代表肉眼颜色，也不是三维结构重建。",
    ] },
    observationEncoding: { bands: asset.bands, colorPolicy: "official-observation-composite; band mapping is presentation encoding", nakedEyeRepresentationClaimed: false, scienceModePolicy: "catalog-marker-coordinate-angular-extent-and-source-state-only", cinematicModePolicy: "candidate-observation-preview-with-credit-rights-signoff-pending" },
  };
});

export const MAINLINE_A3_COVERAGE = Object.freeze({
  constellationCount: MAINLINE_A1_CONSTELLATIONS.length,
  nebulaCount: MAINLINE_A3_NEBULAE.length,
  starCount: MAINLINE_A1_STARS.length,
  localPreviewCount: MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.available,
  humanRightsSignedCount: MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.humanRightsSigned,
  nebulaTextureRights: `${MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.available}-preview-${MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.humanRightsSigned}-signed`,
});

export const MAINLINE_A_CURRENT_COVERAGE = Object.freeze({
  constellationCount: MAINLINE_A_CURRENT_CONSTELLATIONS.length,
  nebulaCount: MAINLINE_A3_NEBULAE.length,
  starCount: MAINLINE_A_CURRENT_STARS.length,
  localPreviewCount: MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.available,
  humanRightsSignedCount: MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.humanRightsSigned,
  nebulaTextureRights: `${MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.available}-preview-${MAINLINE_A_WEB_NEBULA_PREVIEWS_V648.counts.humanRightsSigned}-signed`,
  stellarPortraitAuthority: "presentation-model-only",
});

export const MAINLINE_A1_COVERAGE = Object.freeze({ constellationCount: MAINLINE_A1_CONSTELLATIONS.length, nebulaCount: MAINLINE_A1_NEBULAE.length, starCount: MAINLINE_A1_STARS.length, formalBoundaries: "iau-j2000-ingested-first-set", nebulaTextureRights: "six-cleared-six-pending", stellarPortraitAuthority: "presentation-model-only" });
