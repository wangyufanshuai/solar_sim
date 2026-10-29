import { getMainlineA1CatalogId } from "./mainlineARegistryV607";

export type MainlineAObservationRelationV607 = "视线邻近" | "演化对比" | "物理关联" | "呈现对比";

export type MainlineAObservationDestinationV607 =
  | { readonly objectId: string; readonly catalogId?: never }
  | { readonly catalogId: string; readonly objectId?: never };

export type MainlineAObservationStepV607 = MainlineAObservationDestinationV607 & {
  readonly id: string;
  readonly titleCn: string;
  readonly whyCn: string;
  readonly relationType: MainlineAObservationRelationV607;
  /** Explicit comparison target in this route; the first stop can refer forward. */
  readonly relationToStepId: string;
  readonly relationNoteCn: string;
};

export type MainlineAObservationRouteV607 = {
  readonly id: string;
  readonly titleCn: string;
  readonly questionCn: string;
  readonly summaryCn: string;
  readonly steps: readonly MainlineAObservationStepV607[];
};

/** Reuse registry aliases; external destinations retain their real catalog identity. */
export function getMainlineAObservationStepCatalogIdV607(
  destination: MainlineAObservationDestinationV607,
): string | undefined {
  return typeof destination.objectId === "string"
    ? getMainlineA1CatalogId(destination.objectId)
    : destination.catalogId;
}

export function getMainlineAObservationRoutesForObjectV607(
  objectIdOrCatalogId: string,
): readonly MainlineAObservationRouteV607[] {
  return MAINLINE_A_OBSERVATION_ROUTES_V607.filter((route) =>
    route.steps.some((step) => step.objectId === objectIdOrCatalogId || getMainlineAObservationStepCatalogIdV607(step) === objectIdOrCatalogId),
  );
}

/**
 * Reading routes based on the object narratives in mainlineAMetadataV607.
 * Route order is a learning sequence, not one object's chronological history.
 * Sky position and rounded catalog distances do not establish physical association.
 */
export const MAINLINE_A_OBSERVATION_ROUTES_V607: readonly MainlineAObservationRouteV607[] = [
  {
    id: "orion-clouds-and-stars",
    titleCn: "猎户座：从星际云到恒星",
    questionCn: "同一片星空中，发光气体、暗云与红蓝恒星分别告诉我们什么？",
    summaryCn: "从猎户座找方向，辨认恒星诞生的环境，再比较红蓝超巨星。天空中的邻近不等于空间中的同处一地。",
    steps: [
      {
        id: "orion-sky-map",
        objectId: "Ori",
        titleCn: "猎户座｜先在星空中定位",
        whyCn: "用腰带三星与剑鞘区域辨认方向，再寻找剑鞘中的 M42。星座把不同距离的天体组织成可辨认的天空图案。",
        relationType: "视线邻近",
        relationToStepId: "orion-m42",
        relationNoteCn: "猎户座与 M42 的联系是天空投影和定位关系，不表示星座成员都在同一距离。",
      },
      {
        id: "orion-m42",
        objectId: "m42",
        titleCn: "M42｜年轻恒星照亮气体",
        whyCn: "观察明亮的电离氢区：核心的年轻恒星照亮周围气体。它让我们把星云的发光与恒星形成联系起来。",
        relationType: "视线邻近",
        relationToStepId: "orion-sky-map",
        relationNoteCn: "M42 位于猎户座的天空方向；这条定位关系不把参宿四、参宿七认作其中的成员。",
      },
      {
        id: "orion-horsehead",
        objectId: "b33",
        titleCn: "B33｜暗处也有物质",
        whyCn: "马头轮廓来自冷暗尘埃遮挡后方的发射光。把它与 M42 对照，理解星际物质既能发光，也能挡住光。",
        relationType: "视线邻近",
        relationToStepId: "orion-m42",
        relationNoteCn: "B33 与 M42 都在猎户座方向；这里按视线邻近导航，不由目录中相近的距离值推断同一云团。",
      },
      {
        id: "orion-betelgeuse",
        objectId: "betelgeuse",
        titleCn: "参宿四｜恒星诞生之后",
        whyCn: "离开主序的红超巨星具有扩展、较冷的外层。用它与暗云对照，把问题从恒星形成延伸到恒星晚期的变化。",
        relationType: "演化对比",
        relationToStepId: "orion-horsehead",
        relationNoteCn: "这里只比较暗云与晚期恒星这两个独立样本，不认定参宿四诞生于 B33。",
      },
      {
        id: "orion-rigel",
        objectId: "rigel",
        titleCn: "参宿七｜蓝与红的超巨星",
        whyCn: "把更热的蓝超巨星与参宿四的红色外层并排比较。恒星颜色提示表面温度，但颜色本身不能为两颗恒星排出演化先后。",
        relationType: "演化对比",
        relationToStepId: "orion-betelgeuse",
        relationNoteCn: "参宿七与参宿四是不同恒星；这组对照不表示同一恒星连续变化的两个画面。",
      },
    ],
  },
  {
    id: "stellar-shells",
    titleCn: "恒星晚年：留下怎样的壳层",
    questionCn: "恒星抛出外层之后，为何会留下环、螺旋和复杂的壳层外观？",
    summaryCn: "比较三处行星状星云，观察外层抛射物、壳层形态与视线投影。这是不同对象的并列比较，不是按年龄排列。",
    steps: [
      {
        id: "shells-ring",
        objectId: "m57",
        titleCn: "M57｜先认识一圈气壳",
        whyCn: "环状星云展示了晚期恒星抛出的外层气体与中心白矮星。环形外观与壳层几何、观看方向有关，“行星状”也不意味着行星系统。",
        relationType: "演化对比",
        relationToStepId: "shells-helix",
        relationNoteCn: "先用 M57 的环形外观对照下一站螺旋星云；两者是独立的晚期恒星样本。",
      },
      {
        id: "shells-helix",
        objectId: "ngc7293",
        titleCn: "螺旋星云｜壳层与角大小",
        whyCn: "观察螺旋星云的多壳层结构，并与 M57 在天空中占据的角大小比较。看起来更大还与距离有关，不能直接等同于实际尺寸更大。",
        relationType: "演化对比",
        relationToStepId: "shells-ring",
        relationNoteCn: "螺旋星云与 M57 用于比较行星状星云的外观；不由角大小推定年龄先后。",
      },
      {
        id: "shells-cat-eye",
        objectId: "ngc6543",
        titleCn: "猫眼星云｜简单圆环之外",
        whyCn: "猫眼星云的同心壳层与细丝让我们看到，恒星抛出的物质可以形成复杂结构。图像呈现的是投影外观，不能仅凭轮廓还原完整三维形态。",
        relationType: "演化对比",
        relationToStepId: "shells-helix",
        relationNoteCn: "猫眼与螺旋星云是两个独立对象，用来比较壳层形态，不组成共同系统。",
      },
    ],
  },
  {
    id: "massive-star-feedback",
    titleCn: "大质量恒星：怎样改变周围环境",
    questionCn: "从恒星辐射到超新星遗迹，恒星如何把能量传给周围物质？",
    summaryCn: "从天蝎座辨认红超巨星，转向恒星形成区和超新星遗迹，最后追踪 M1 内部持续注入能量的脉冲星。",
    steps: [
      {
        id: "feedback-scorpius",
        objectId: "Sco",
        titleCn: "天蝎座｜找到红色锚点",
        whyCn: "沿天蝎座的轮廓寻找醒目的心宿二。先建立天空中的方位，再把注意力转向这颗红超巨星。",
        relationType: "视线邻近",
        relationToStepId: "feedback-antares",
        relationNoteCn: "天蝎座与心宿二的联系是天空投影和定位关系；星座轮廓不代表一个真实恒星系统。",
      },
      {
        id: "feedback-antares",
        objectId: "antares",
        titleCn: "心宿二｜红超巨星的外层",
        whyCn: "观察红超巨星较冷、扩展的外层，认识大质量恒星的一种晚期状态。随后转向其他天区，比较恒星影响气体的不同情景。",
        relationType: "视线邻近",
        relationToStepId: "feedback-scorpius",
        relationNoteCn: "心宿二是天蝎座方向的定位锚点；下站船底座星云是另一个对象，用于演化对比。",
      },
      {
        id: "feedback-carina",
        objectId: "carina",
        titleCn: "船底座星云｜恒星塑造云气",
        whyCn: "这里的大质量年轻恒星与复杂尘埃云并存，强烈辐射和恒星反馈塑造发射区。它展示了恒星仍在发光时就能改变周围环境。",
        relationType: "演化对比",
        relationToStepId: "feedback-antares",
        relationNoteCn: "船底座星云与心宿二是独立样本，用来比较年轻恒星群与红超巨星；不表示心宿二照亮了这片星云。",
      },
      {
        id: "feedback-crab-nebula",
        objectId: "m1",
        titleCn: "M1｜爆发之后的遗迹",
        whyCn: "蟹状星云的丝状气体记录了超新星爆发后的遗迹结构。把它与船底座的恒星形成区对照，比较不同阶段的能量注入。",
        relationType: "演化对比",
        relationToStepId: "feedback-carina",
        relationNoteCn: "M1 与船底座星云分属不同对象；这里比较恒星形成区和超新星遗迹，不把它们串成同一系统的历史。",
      },
      {
        id: "feedback-crab-pulsar",
        catalogId: "pulsar:b0531+21",
        titleCn: "蟹状脉冲星｜遗迹中的能量源",
        whyCn: "转向 M1 中的蟹状脉冲星，认识向周围星云持续注入能量的致密天体。这次跳转连接的是遗迹与其中的真实成员。",
        relationType: "物理关联",
        relationToStepId: "feedback-crab-nebula",
        relationNoteCn: "蟹状脉冲星位于 M1 内并向周围注入能量；这一关系来自对象资料，不由天空位置重合推断。",
      },
    ],
  },
  {
    id: "sky-anchors-and-portraits",
    titleCn: "天空锚点与恒星肖像：看见的尺度",
    questionCn: "星座线稿、恒星参数和真实天空方向，应该怎样放在同一张图里？",
    summaryCn: "把大熊座和仙后座的星图线稿与三颗独立恒星的参数化肖像并列，明确展示模型与天空投影的边界。",
    steps: [
      { id: "anchors-uma", objectId: "UMa", titleCn: "大熊座｜先读线稿", whyCn: "观察 IAU 边界与习惯连线如何组织天空方向。线稿服务于识别，不代表恒星处在同一空间平面。", relationType: "呈现对比", relationToStepId: "anchors-cas", relationNoteCn: "大熊座与仙后座是两个天空图案；这里比较线稿的识别方式，不表示它们构成物理系统。" },
      { id: "anchors-cas", objectId: "Cas", titleCn: "仙后座｜换一个识别锚点", whyCn: "用 W 形主星作为第二个方向锚点，再比较星座边界和恒星标签的层级。", relationType: "呈现对比", relationToStepId: "anchors-uma", relationNoteCn: "仙后座与大熊座只在导航层并列；星座边界和连线都不是距离测量。" },
      { id: "anchors-alpha-centauri", objectId: "alpha-centauri-a", titleCn: "半人马座 α A｜参数化太阳型肖像", whyCn: "查看最近邻太阳型主星的色温、半径与光度输入，理解参数如何驱动画面。", relationType: "呈现对比", relationToStepId: "anchors-cas", relationNoteCn: "恒星肖像是参数化展示模型，与前两步的天空线稿属于不同表达层。" },
      { id: "anchors-sirius", objectId: "sirius-a", titleCn: "天狼星 A｜视亮度不等于本征尺度", whyCn: "用明亮的近邻恒星对照太阳型肖像，区分视星等、距离和本征光度。", relationType: "呈现对比", relationToStepId: "anchors-alpha-centauri", relationNoteCn: "天狼星 A 与半人马座 α A 是独立恒星；这里比较目录参数和视觉层，不推断共同演化。" },
      { id: "anchors-achernar", objectId: "achernar", titleCn: "水委一｜球体只是近似", whyCn: "查看快速自转恒星的扁率参数，认识同一套肖像组件也能表达非球形的展示提示。", relationType: "呈现对比", relationToStepId: "anchors-sirius", relationNoteCn: "水委一、天狼星 A 与半人马座 α A 是不同恒星；扁率和色温仅用于参数化呈现。" },
    ],
  },
  {
    id: "nebula-morphology-and-wavelengths",
    titleCn: "星云形态与波段：同一颜色不是同一种物理",
    questionCn: "发射区、尘埃和超新星丝网的颜色与形态，如何避免被误读成肉眼或三维结构？",
    summaryCn: "比较五张有来源观测图，逐步区分恒星形成区、尘埃结构与冲击波丝网；所有颜色都保留波段和二维边界。",
    steps: [
      { id: "morphology-m8", objectId: "m8", titleCn: "礁湖星云｜发射区层次", whyCn: "从电离氢区开始，观察年轻恒星辐射形成的发射结构。", relationType: "演化对比", relationToStepId: "morphology-m16", relationNoteCn: "礁湖星云与鹰状星云是独立恒星形成区；颜色来自观测波段映射，不表示肉眼颜色。" },
      { id: "morphology-m16", objectId: "m16", titleCn: "鹰状星云｜尘埃柱轮廓", whyCn: "把尘埃柱的剪影和发射背景分开阅读，不把二维轮廓当成已测量的三维深度。", relationType: "演化对比", relationToStepId: "morphology-m8", relationNoteCn: "M16 与 M8 用于比较发射区和尘埃结构，不表示两者共享一片云或同一距离。" },
      { id: "morphology-m20", objectId: "m20", titleCn: "三叶星云｜发射与反射并置", whyCn: "识别发射气体、反射尘埃和暗带的视觉差异，保留各波段的来源说明。", relationType: "演化对比", relationToStepId: "morphology-m16", relationNoteCn: "M20 与 M16 是不同对象；图像颜色和形态用于解释成分，不构成三维重建。" },
      { id: "morphology-rosette", objectId: "ngc2237", titleCn: "玫瑰星云｜局部视场与整体名称", whyCn: "观察官方局部视场，同时记住项目条目代表玫瑰星云复合体，不声称影像覆盖完整环。", relationType: "演化对比", relationToStepId: "morphology-m20", relationNoteCn: "玫瑰星云与三叶星云都是独立发射区；局部影像不能扩展成完整目录边界。" },
      { id: "morphology-veil", objectId: "ngc6960", titleCn: "面纱星云｜冲击波丝网", whyCn: "最后对照超新星遗迹丝状结构，理解同样的彩色合成可以表达完全不同的物理过程。", relationType: "演化对比", relationToStepId: "morphology-rosette", relationNoteCn: "NGC 6960 与玫瑰星云分属不同对象；丝网与发射区的比较不表示共同演化历史。" },
    ],
  },
];
