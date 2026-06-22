"use client";

import { BlendFunction } from "postprocessing";
import { wrapEffect } from "@react-three/postprocessing";
import { LightBenderEffectImpl } from "./LightBenderEffect";

const LightBender = wrapEffect(LightBenderEffectImpl, {
  blendFunction: BlendFunction.NORMAL,
});

export default LightBender;
