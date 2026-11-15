

### A11 科研线修复（2026-11-15）

A11 木卫一阴影时刻已由约 2.5 小时误差修复至最坏 12.94 秒：木星卫星配对使用 10 km 软化，保留其他配对的全局软化，并加入 IAU/NAIF Jupiter J2000 极轴 J2 力。Newton/EIH 两种模式均无 RK4 回退。收据位于 `scripts/a11/io-shadow-timing-results.json`；行星回归和宽泛软化负对照也一并保留。
