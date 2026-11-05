import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config.mjs";

describe("v566 Next 16 development watch contract", () => {
  it("uses one schema-valid RegExp that covers build slots and Windows system files", () => {
    const webpackHook = nextConfig.webpack;
    expect(typeof webpackHook).toBe("function");
    if (!webpackHook) return;
    const config = { plugins: [], watchOptions: {} };
    const transformed = webpackHook(config as never, {
      dev: true,
      isServer: false,
      nextRuntime: undefined,
      webpack: {},
    } as never) as typeof config & { watchOptions: { ignored: unknown } };
    expect(transformed.watchOptions.ignored).toBeInstanceOf(RegExp);
    const ignored = transformed.watchOptions.ignored as RegExp;
    expect(ignored.test("E:\\86137\\myai\\solar_sim\\next-web\\node_modules\\next\\index.js")).toBe(true);
    expect(ignored.test("E:\\86137\\myai\\solar_sim\\next-web\\.next-atlas-standalone-current\\server.js")).toBe(true);
    expect(ignored.test("E:\\pagefile.sys")).toBe(true);
    expect(ignored.test("E:\\DumpStack.log.tmp")).toBe(true);
    expect(ignored.test("E:\\86137\\myai\\solar_sim\\next-web\\app\\page.tsx")).toBe(false);
  });
});
