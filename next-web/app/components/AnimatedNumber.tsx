"use client";

import { useSpring, useMotionValueEvent } from "framer-motion";
import { useEffect, useState } from "react";

type AnimatedNumberProps = {
  value: number;
  format: (n: number) => string;
  className?: string;
};

/**
 * Smooth numeric display for live-updating metrics (sidebar).
 */
export default function AnimatedNumber({
  value,
  format,
  className,
}: AnimatedNumberProps) {
  const spring = useSpring(value, {
    stiffness: 200,
    damping: 34,
    mass: 0.35,
  });
  const [text, setText] = useState(() => format(value));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useMotionValueEvent(spring, "change", (latest) => {
    setText(format(latest));
  });

  return <span className={className}>{text}</span>;
}
