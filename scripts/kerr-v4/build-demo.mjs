// Builds public/kerr-v4-demo.html: the template with the bundled demo inlined.
// Usage (from next-web): node scripts/kerr-v4/build-demo.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// esbuild is not a direct dependency; fall back to the copy that ships with tsx.
const require = createRequire(import.meta.url);
const { build } = (() => {
  for (const id of ["esbuild", join(process.cwd(), "node_modules", "tsx", "node_modules", "esbuild")]) {
    try {
      return require(id);
    } catch {
      /* try next */
    }
  }
  throw new Error("esbuild not found (install it or keep tsx in devDependencies)");
})();
const here = dirname(fileURLToPath(import.meta.url));
const out = await build({ entryPoints: [join(here, "demo-entry.ts")], bundle: true, minify: true, write: false, format: "iife", target: "es2020" });
const html = readFileSync(join(here, "demo-template.html"), "utf8").replace("/*__BUNDLE__*/", () => out.outputFiles[0].text.replace(/<\/script/g, "<\\/script"));
const target = process.argv[2] ?? join(here, "..", "..", "public", "kerr-v4-demo.html");
writeFileSync(target, html);
console.log(`wrote ${target} (${(html.length / 1024).toFixed(0)} KiB)`);
