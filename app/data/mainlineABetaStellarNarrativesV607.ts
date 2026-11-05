/** Editorial explanations of existing catalog inputs; no new measured values. */
export const MAINLINE_A_BETA_STELLAR_NARRATIVES: Readonly<Record<string, {
  summaryCn: string;
  detailCn: string;
  relatedObjectIds: readonly string[];
}>> = {
  "alpha-centauri-b": {
    summaryCn: "半人马座近邻双星中的暖色组件",
    detailCn: "半人马座 α B 与 α A 是同一近邻系统中的不同恒星组件。本卡用目录中的色温与尺度生成暖色光球，让两颗恒星可以逐一比较。SIMBAD 封存快照按 B 组件解析，视差派生值作为独立来源参考列出；这并不确认 Gaia 渲染锚点的身份。画面的对流颗粒、光晕与光球朝向均属展示模型，未从静态资料推断双星轨道，也未更新科学计算参数。",
    relatedObjectIds: ["alpha-centauri-a"],
  },
  hadar: {
    summaryCn: "南天导航中的蓝色亮星马腹一",
    detailCn: "马腹一（Hadar）位于半人马座方向。目录以高温蓝色光球作为它的展示形态，适合与较冷的近邻恒星作颜色和尺度对照。具名恒星的 SIMBAD 资料与用于场景定位的 Gaia 条目分层列出；相近的天空位置不构成同一对象的证明。卡片采用归一化尺寸，因此光球占据同样的画幅并不表示真实半径相同；任何系统结构都不能从这张参数化肖像反推。",
    relatedObjectIds: ["Cru"],
  },
  altair: {
    summaryCn: "天鹰座中呈现旋转扁率的河鼓二",
    detailCn: "河鼓二（Altair）为天鹰座提供明亮的导航锚点，与织女星、天津四形成熟悉的夏季天空图形。肖像消费目录中的赤道与极半径比，用椭圆轮廓表达旋转形态；当前朝向是说明用途的赤道侧视，并不是按观测倾角重建的图像。温度、光度和尺度仍属于展示输入，SIMBAD 视差参考单独保留，其误差不会套到这些模型参数上。",
    relatedObjectIds: ["Aql", "vega", "deneb"],
  },
  pollux: {
    summaryCn: "双子座的暖色巨星北河三",
    detailCn: "北河三（Pollux）是双子座中醒目的暖色亮星。本卡以目录中的巨星参数呈现扩展光球，并通过与蓝白色恒星的并置解释色温差异。肖像表面使用稳定的程序颗粒，既不代表解析观测，也不表示某一时刻的真实表面活动。具名来源的视差参考附带原始误差；场景的目录距离和光度仍保持原值，避免把资料编纂参考误写成一次新的科学测量。",
    relatedObjectIds: ["Gem"],
  },
  fomalhaut: {
    summaryCn: "南鱼座方向的白色亮星北落师门",
    detailCn: "北落师门（Fomalhaut）在南方天空中容易辨认，当前目录为其光球提供白色亮星的展示参数。这里重点比较光球的温度与归一化尺度，不在画面中生成未经本轮证据支持的盘结构或行星。SIMBAD 的具名来源参考和 Gaia 的渲染锚点各自保留，视差的一阶传播误差只描述引用的距离参考。画面越精细，不意味着表面结构或输入参数被测得越精确。",
    relatedObjectIds: ["vega"],
  },
  deneb: {
    summaryCn: "天鹅座北十字顶端的白色超巨星天津四",
    detailCn: "天津四（Deneb）位于天鹅座的北十字顶端，为银河背景提供鲜明的导航方向。目录用高光度和扩展半径描述它的展示外观，与河鼓二、织女星并列时可以区分光球尺度和视线几何。SIMBAD 视差参考具有相对较大的误差；一阶反演值并非精确距离解。肖像保持归一化尺寸，实际场景目录距离未被反演参考替换，也没有从超巨星纹理推断脉动周期。",
    relatedObjectIds: ["Cyg", "altair", "vega"],
  },
  bellatrix: {
    summaryCn: "猎户座肩部的蓝色亮星参宿五",
    detailCn: "参宿五（Bellatrix）位于猎户座肩部，与参宿四提供明显的冷暖颜色对照。当前肖像由目录温度与光度驱动，蓝色临边和细颗粒层帮助辨认较热的光球；这些图案不表示观测到的对流胞。具名恒星来源通过封存的 SIMBAD 行引用，Gaia 标识只用于场景锚定。猎户座内的邻接关系表示天空方向而非共同距离，不会为这些恒星添加虚构的物理连接。",
    relatedObjectIds: ["Ori", "betelgeuse", "rigel"],
  },
  alnilam: {
    summaryCn: "猎户座腰带中央的亮星参宿二",
    detailCn: "参宿二（Alnilam）是猎户座腰带中央的亮星。在本轮的恒星图集中，它用蓝白色与扩展光球连接腰带的天空位置和目录所描述的恒星类型。视差参考来自已有文献编纂快照，并明确保留误差与上游出处；它不取代场景距离。腰带三星的排列是投影几何，肖像也没有重建恒星表面、风场或真实亮度变化，避免把艺术细节误当成观测结构。",
    relatedObjectIds: ["Ori", "bellatrix", "rigel"],
  },
};
