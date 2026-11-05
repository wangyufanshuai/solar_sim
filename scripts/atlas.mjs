#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  loadAtlasLegacyCommandMapV256,
  rewriteAtlasLegacyCommandReferencesV256,
} from "./atlas-legacy-command-map-v256.mjs";

const projectRoot = resolve(process.cwd());
const [domain = "help", action = "", ...rest] = process.argv.slice(2);
const npmCli = process.env.npm_execpath;
const python = process.platform === "win32"
  ? resolve(projectRoot, ".venv-science/Scripts/python.exe")
  : resolve(projectRoot, ".venv-science/bin/python");

function run(command, args) {
  const result = spawnSync(command, args, { cwd: projectRoot, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

function runNpm(script, args = []) {
  if (!npmCli) throw new Error("npm_execpath is unavailable");
  run(process.execPath, [npmCli, "run", script, "--", ...args]);
}

function quoteLegacyArg(value) {
  if (/^[A-Za-z0-9_./:=@+,-]+$/.test(value)) return value;
  if (process.platform === "win32") return `"${value.replaceAll('"', '""')}"`;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function runLegacyCommand(commandBody, args, legacy) {
  const packageJson = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8"));
  const rewrittenBody = rewriteAtlasLegacyCommandReferencesV256(
    commandBody,
    legacy,
    packageJson.scripts ?? {},
  );
  const commandLine = [rewrittenBody, ...args.map(quoteLegacyArg)].join(" ");
  if (process.platform === "win32") {
    run(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", commandLine]);
  } else {
    run(process.env.SHELL ?? "/bin/sh", ["-lc", commandLine]);
  }
}

function help() {
  console.log(`Orbit Atlas unified CLI (v256)

  npm run atlas -- build standalone|lite|local-shadow
  npm run atlas -- catalog healpix|healpix-v9|healpix-v10|science|research-v267|research-v271|gaia-10m-fetch-next|gaia-10m-fetch-series|gaia-10m-build|gaia-10m-verify|cosmic
  npm run atlas -- relativity reference-v276-build|reference-v276-validate|oracle-v276|reference-v282-fetch-missing|reference-v282r2-inspect|reference-v282r2-fetch-mercury|reference-v282-run|reference-v282-validate|kerr-v277-short-gate|kerr-v279-init|kerr-v283-short-gate|kerr-v284-run-next|kerr-v284-run-series|kerr-v284-status|kerr-v284-aggregate|kerr-v288-short-gate|kerr-v288-run-next|kerr-v288-status|kerr-v291-diagnose|kerr-v292-short-gate|kerr-v293-polarization-gate|kerr-v296-diagnose|kerr-v296-short-gate|kerr-v297-polarization-gate|kerr-v298-init|kerr-v298-status|kerr-v298r1-init|kerr-v298r1-status|kerr-v298r1-probe-rss|kerr-v298r1-run-next|kerr-v298r1-run-series|kerr-v298r1-audit-published|kerr-v298r1-audit-shard0-v311|kerr-v298r1-aggregate|kerr-v312-inspect|kerr-v312-short-gate|kerr-v313-inspect|kerr-v313-polarization-gate|kerr-v314-init|kerr-v314-status|kerr-v314-aggregate-check|kerr-v314-run-next-dry-run|kerr-v314-run-next|kerr-v319-build-spectrum|kerr-v320-build-bands|kerr-v321-build-raster|kerr-v325-build-uncertainty|kerr-v326-build-provenance|kerr-v327-build-ab|kerr-v328-build-photon-bands|kerr-v331-build-provenance|kerr-v332-build-instrument-response|kerr-v333-build-hud-audit|kerr-v334-build-runtime-matrix|kerr-v335-build-lifecycle-replay|runtime-v336-build-state-replay|kerr-v337-build-buffer-replay|provenance-v339-build|visual-v340-build|observation-v341-build|observation-raster-v342-build|observation-images-v343-build|image-lifecycle-v344-build|image-preview-v345-build|image-probe-v346-build|image-roi-v347-build|band-contrast-v348-build|visual-v349-build|band-observation-v350-build|observer-uncertainty-v351-build|photon-response-v352-build
  npm run atlas -- relativity spectral-shape-v353-build
  npm run atlas -- relativity kerr-v546-build-fits-validation|kerr-v546-build-runtime
  npm run atlas -- relativity kerr-v547-build-blind-review|kerr-v547-build-runtime
  npm run atlas -- relativity kerr-v548-build-provenance|kerr-v548-build-runtime
  npm run atlas -- relativity kerr-v549-build-sidecar|kerr-v549-build-runtime
  npm run atlas -- relativity kerr-v550-build-pack|kerr-v550-build-runtime
  npm run atlas -- relativity kerr-v551-build-confirmation|kerr-v551-build-runtime
  npm run atlas -- relativity kerr-v552-build-packet|kerr-v552-build-runtime
  npm run atlas -- relativity kerr-v553-build-join|kerr-v553-build-runtime
  npm run atlas -- relativity kerr-v555-build-image|kerr-v555-build-runtime
  npm run atlas -- relativity kerr-v556-build-products|kerr-v556-build-runtime
  npm run atlas -- relativity kerr-v557-build-products|kerr-v557-build-runtime
  npm run atlas -- relativity kerr-v558-build-pack|kerr-v558-build-runtime
  npm run atlas -- relativity kerr-v559-build-ledger|kerr-v559-build-runtime
  npm run atlas -- relativity kerr-v560-build-envelope
  npm run atlas -- relativity spectral-correlation-v354-build
  npm run atlas -- relativity spectral-eigenmodes-v355-build
  npm run atlas -- relativity spectral-envelope-v356-build
  npm run atlas -- relativity confidence-scale-v357-build
  npm run atlas -- relativity observable-photons-v358-build
  npm run atlas -- relativity counting-noise-v359-build
  npm run atlas -- relativity detector-break-even-v360-build
  npm run atlas -- relativity detector-calibration-v361-inspect
  npm run atlas -- relativity visual-v362-build
  npm run atlas -- relativity detector-calibration-v363-plan
  npm run atlas -- relativity detector-calibration-v364-pack
  npm run atlas -- relativity detector-calibration-v365-inspect|detector-calibration-v365-compile
  npm run atlas -- relativity detector-calibration-v366-inspect
  npm run atlas -- relativity detector-calibration-v367-inspect|detector-calibration-v367-admit
  npm run atlas -- relativity detector-response-v368-inspect
  npm run atlas -- relativity detector-calibration-v504-preflight
  npm run atlas -- relativity measured-expectation-v369-inspect
  npm run atlas -- relativity observation-geometry-v370-pack|visual-v370-build
  npm run atlas -- relativity observation-geometry-v371-inspect|observation-geometry-v371-compile
  npm run atlas -- relativity observation-geometry-v372-inspect|observation-geometry-v372-validate
  npm run atlas -- relativity observation-geometry-v373-inspect|observation-geometry-v373-admit
  npm run atlas -- relativity observation-geometry-v374-inspect|observation-geometry-v374-publish
  npm run atlas -- relativity measured-expectation-v375-inspect|measured-expectation-v375-build
  npm run atlas -- relativity expected-electron-image-v376-inspect|expected-electron-image-v376-build
  npm run atlas -- relativity visual-v377-build
  npm run atlas -- relativity measurement-authority-v378-build
  npm run atlas -- relativity measurement-authority-v379-build
  npm run atlas -- relativity measurement-authority-v380-adversarial
  npm run atlas -- relativity measurement-authority-v381-audit
  npm run atlas -- relativity measurement-authority-v382-fetch-visible
  npm run atlas -- relativity measurement-authority-v382r1-forensic
  npm run atlas -- relativity measurement-authority-v383-oracle|measurement-authority-v383-normalize-visible
  npm run atlas -- relativity measurement-authority-v384-oracle|measurement-authority-v384-build-photon-observable
  npm run atlas -- relativity measurement-authority-v385-oracle|measurement-authority-v385-build-error-budget
  npm run atlas -- relativity measurement-authority-v386-oracle|measurement-authority-v386-build-sensitivity
  npm run atlas -- relativity measurement-authority-v387-oracle|measurement-authority-v387-build-identifiability
  npm run atlas -- relativity measurement-authority-v388-oracle|measurement-authority-v388-build-conditioned-temperature
  npm run atlas -- relativity measurement-authority-v389-oracle|measurement-authority-v389-build-temperature-interval
  npm run atlas -- relativity measurement-authority-v390-oracle|measurement-authority-v390-build-systematics-transfer
  npm run atlas -- relativity measurement-authority-v391-oracle|measurement-authority-v391-build-trust-region
  npm run atlas -- relativity measurement-authority-v392-oracle|measurement-authority-v392-build-covariance-admission
  npm run atlas -- relativity measurement-authority-v393-oracle|measurement-authority-v393-build-source-dossier
  npm run atlas -- relativity measurement-authority-v394-oracle|measurement-authority-v394-build-global-covariance
  npm run atlas -- relativity measurement-authority-v395-oracle|measurement-authority-v395-build-observability|measurement-authority-v396-oracle|measurement-authority-v396-build-design|measurement-authority-v397-oracle|measurement-authority-v397-build-admission|measurement-authority-v398-inspect|measurement-authority-v398-compile|measurement-authority-v399-build-template|visual-v400-build|observation-v401-build|observation-v402-build-lifecycle|observation-v403-replay|observation-v404-build-summary|observation-v405-build-dossier|kerr-v406-build-stokes|kerr-v407-build-scattering|kerr-v408-build-oracle|kerr-v409-build-correction|kerr-v410-build-polarimeter
  npm run atlas -- assets visual-v274|cinematic-v280|cinematic-v289-stage|cinematic-v299-stage
  npm run atlas -- test focused|v271-recovery|shadow-v270|shadow-v275|shadow-v285r1|shadow-v290|shadow-v295|shadow-v296|shadow-v297|shadow-v299|shadow-v312|shadow-v313|shadow-v315|shadow-v316|shadow-v317|shadow-v318|shadow-v319|shadow-v320|shadow-v321|shadow-v322|shadow-v323|shadow-v324|shadow-v325|shadow-v326|shadow-v327|shadow-v328|shadow-v329|shadow-v330|shadow-v331|shadow-v332|shadow-v333|shadow-v334|shadow-v335|shadow-v336|shadow-v337|shadow-v338|shadow-v339|shadow-v340|shadow-v341|shadow-v342|shadow-v343|shadow-v344|shadow-v345|shadow-v346|shadow-v347|shadow-v348|shadow-v349|shadow-v350|shadow-v351|shadow-v352|types|full
  npm run atlas -- evidence truth-v286|kerr-v288-envelope|kerr-v296-envelope|kerr-v297-envelope|shadow-v290|shadow-v295|shadow-v296|shadow-v297|shadow-v299|shadow-v312|shadow-v313|shadow-v314|shadow-v315|shadow-v316|shadow-v317|shadow-v318|shadow-v319|shadow-v320|shadow-v321|shadow-v322|shadow-v323|shadow-v324|shadow-v325|shadow-v326|shadow-v327|shadow-v328|shadow-v329|shadow-v330|shadow-v331|shadow-v332|shadow-v333|shadow-v334|shadow-v335|shadow-v336|shadow-v337|shadow-v338|shadow-v339|shadow-v340|shadow-v341|shadow-v342|shadow-v343|shadow-v344|shadow-v345|shadow-v346|shadow-v347|shadow-v348|shadow-v349|shadow-v350|shadow-v351|shadow-v352|v262|v263|v271-attempt-negative|v271-closure|v272-low-memory-negative|v267|v268|v269|v270-shadow|v275-browser-diagnostic|v275-soak-diagnostic-negative|v275-soak-corrected|v275-performance-diagnostic|v275-visual-diagnostic-negative|v275-visual-mobile-corrected-negative|v275-shadow|v276-reference|v278-strong-gravity|v280-focused-negative|shadow-v280|shadow-v281|shadow-v285|shadow-v285r1
  npm run atlas -- test shadow-v353
  npm run atlas -- test shadow-v546
  npm run atlas -- test shadow-v547
  npm run atlas -- test shadow-v548
  npm run atlas -- test shadow-v549
  npm run atlas -- test shadow-v550
  npm run atlas -- test shadow-v551
  npm run atlas -- test shadow-v552
  npm run atlas -- test shadow-v553
  npm run atlas -- test shadow-v554
  npm run atlas -- test shadow-v555
  npm run atlas -- test shadow-v556
  npm run atlas -- test shadow-v557
  npm run atlas -- test shadow-v558
  npm run atlas -- test shadow-v559|shadow-v560
  npm run atlas -- evidence shadow-v353
  npm run atlas -- evidence shadow-v546
  npm run atlas -- evidence shadow-v547
  npm run atlas -- evidence shadow-v548
  npm run atlas -- evidence shadow-v549
  npm run atlas -- evidence shadow-v550
  npm run atlas -- evidence shadow-v551
  npm run atlas -- evidence shadow-v552
  npm run atlas -- evidence shadow-v553
  npm run atlas -- evidence shadow-v554
  npm run atlas -- evidence shadow-v555
  npm run atlas -- evidence shadow-v556
  npm run atlas -- evidence shadow-v557
  npm run atlas -- evidence shadow-v558
  npm run atlas -- evidence shadow-v559|shadow-v560
  npm run atlas -- evidence shadow-v553-focused-negative
  npm run atlas -- test shadow-v354
  npm run atlas -- evidence shadow-v354
  npm run atlas -- test shadow-v355
  npm run atlas -- evidence shadow-v355
  npm run atlas -- test shadow-v356
  npm run atlas -- evidence shadow-v356
  npm run atlas -- test shadow-v357
  npm run atlas -- evidence shadow-v357
  npm run atlas -- test shadow-v358
  npm run atlas -- evidence shadow-v358
  npm run atlas -- test shadow-v359
  npm run atlas -- evidence shadow-v359
  npm run atlas -- test shadow-v360
  npm run atlas -- evidence shadow-v360
  npm run atlas -- test shadow-v361
  npm run atlas -- evidence shadow-v361
  npm run atlas -- test shadow-v362
  npm run atlas -- evidence shadow-v362
  npm run atlas -- test shadow-v363
  npm run atlas -- evidence shadow-v363
  npm run atlas -- test shadow-v364
  npm run atlas -- evidence shadow-v364
  npm run atlas -- test shadow-v365
  npm run atlas -- evidence shadow-v365
  npm run atlas -- test shadow-v366
  npm run atlas -- evidence shadow-v366
  npm run atlas -- test shadow-v367
  npm run atlas -- evidence shadow-v367
  npm run atlas -- test shadow-v368
  npm run atlas -- evidence shadow-v368
  npm run atlas -- test shadow-v369
  npm run atlas -- evidence shadow-v369
  npm run atlas -- test shadow-v370
  npm run atlas -- evidence shadow-v370
  npm run atlas -- test shadow-v371
  npm run atlas -- evidence shadow-v371
  npm run atlas -- test shadow-v372
  npm run atlas -- evidence shadow-v372
  npm run atlas -- test shadow-v373
  npm run atlas -- evidence shadow-v373
  npm run atlas -- test shadow-v374
  npm run atlas -- evidence shadow-v374
  npm run atlas -- test shadow-v375
  npm run atlas -- evidence shadow-v375
  npm run atlas -- test shadow-v376
  npm run atlas -- evidence shadow-v376
  npm run atlas -- test shadow-v377
  npm run atlas -- evidence shadow-v377
  npm run atlas -- test shadow-v378
  npm run atlas -- evidence shadow-v378
  npm run atlas -- test shadow-v379
  npm run atlas -- evidence shadow-v379
  npm run atlas -- test shadow-v380
  npm run atlas -- evidence shadow-v380
  npm run atlas -- test shadow-v381
  npm run atlas -- evidence shadow-v381
  npm run atlas -- test shadow-v382r1
  npm run atlas -- evidence shadow-v382r1
  npm run atlas -- test shadow-v383
  npm run atlas -- evidence shadow-v383
  npm run atlas -- test shadow-v384
  npm run atlas -- evidence shadow-v384
  npm run atlas -- test shadow-v385
  npm run atlas -- evidence shadow-v385
  npm run atlas -- test shadow-v386
  npm run atlas -- evidence shadow-v386
  npm run atlas -- test shadow-v387
  npm run atlas -- evidence shadow-v387
  npm run atlas -- test shadow-v388
  npm run atlas -- evidence shadow-v388
  npm run atlas -- test shadow-v389
  npm run atlas -- evidence shadow-v389
  npm run atlas -- test shadow-v390
  npm run atlas -- evidence shadow-v390
  npm run atlas -- test shadow-v391
  npm run atlas -- evidence shadow-v391
  npm run atlas -- test shadow-v392
  npm run atlas -- evidence shadow-v392
  npm run atlas -- test shadow-v393
  npm run atlas -- evidence shadow-v393
  npm run atlas -- test shadow-v394
  npm run atlas -- evidence shadow-v394
  npm run atlas -- test shadow-v395
  npm run atlas -- evidence shadow-v395
  npm run atlas -- test shadow-v396|shadow-v397|shadow-v398|shadow-v399|shadow-v400
  npm run atlas -- evidence shadow-v396|shadow-v397|shadow-v398|shadow-v399|shadow-v400
  npm run atlas -- test shadow-v401
  npm run atlas -- evidence shadow-v401
  npm run atlas -- test shadow-v402
  npm run atlas -- evidence shadow-v402
  npm run atlas -- test shadow-v403
  npm run atlas -- evidence shadow-v403
  npm run atlas -- test shadow-v404
  npm run atlas -- evidence shadow-v404
  npm run atlas -- test shadow-v405
  npm run atlas -- evidence shadow-v405
  npm run atlas -- test shadow-v406
  npm run atlas -- evidence shadow-v406
  npm run atlas -- test shadow-v407
  npm run atlas -- evidence shadow-v407
  npm run atlas -- test shadow-v408
  npm run atlas -- evidence shadow-v408
  npm run atlas -- test shadow-v409
  npm run atlas -- evidence shadow-v409
  npm run atlas -- test shadow-v410
  npm run atlas -- evidence shadow-v410
  npm run atlas -- relativity kerr-v411-build-calibration-contract
  npm run atlas -- test shadow-v411
  npm run atlas -- evidence shadow-v411
  npm run atlas -- relativity kerr-v412-build-inversion
  npm run atlas -- test shadow-v412
  npm run atlas -- evidence shadow-v412
  npm run atlas -- relativity kerr-v413-build-spectral-response
  npm run atlas -- test shadow-v413
  npm run atlas -- evidence shadow-v413
  npm run atlas -- relativity kerr-v414-build-detector-counts
  npm run atlas -- test shadow-v414
  npm run atlas -- evidence shadow-v414
  npm run atlas -- relativity kerr-v415-build-detector-likelihood
  npm run atlas -- test shadow-v415
  npm run atlas -- evidence shadow-v415
  npm run atlas -- relativity kerr-v416-build-stokes-ensemble
  npm run atlas -- test shadow-v416
  npm run atlas -- evidence shadow-v416
  npm run atlas -- relativity kerr-v417-build-nonlinear-observables
  npm run atlas -- test shadow-v417
  npm run atlas -- evidence shadow-v417
  npm run atlas -- relativity kerr-v418-build-sparse-polarimetry
  npm run atlas -- test shadow-v418
  npm run atlas -- evidence shadow-v418
  npm run atlas -- relativity kerr-v419-build-screen-coordinates
  npm run atlas -- test shadow-v419
  npm run atlas -- evidence shadow-v419
  npm run atlas -- relativity kerr-v420-build-observer-wcs
  npm run atlas -- test shadow-v420
  npm run atlas -- evidence shadow-v420
  npm run atlas -- relativity kerr-v421-build-axial-vectors
  npm run atlas -- test shadow-v421
  npm run atlas -- evidence shadow-v421
  npm run atlas -- relativity kerr-v422-build-orientation-basis
  npm run atlas -- test shadow-v422
  npm run atlas -- evidence shadow-v422
  npm run atlas -- relativity kerr-v423-build-predicted-stokes
  npm run atlas -- test shadow-v423
  npm run atlas -- evidence shadow-v423
  npm run atlas -- relativity kerr-v424-build-predicted-polarimeter
  npm run atlas -- test shadow-v424
  npm run atlas -- evidence shadow-v424
  npm run atlas -- relativity kerr-v425-build-spectral-admission
  npm run atlas -- test shadow-v425
  npm run atlas -- evidence shadow-v425
  npm run atlas -- relativity kerr-v426-build-high-energy-response
  npm run atlas -- test shadow-v426
  npm run atlas -- evidence shadow-v426
  npm run atlas -- relativity kerr-v427-build-response-acquisition-pack
  npm run atlas -- test shadow-v427
  npm run atlas -- evidence shadow-v427
  npm run atlas -- relativity kerr-v428-build-response-intake
  npm run atlas -- relativity kerr-v428-validate-response-submission --input <explicit-local-zip>
  npm run atlas -- test shadow-v428
  npm run atlas -- evidence shadow-v428
  npm run atlas -- relativity kerr-v429-build-response-uncertainty
  npm run atlas -- test shadow-v429
  npm run atlas -- evidence shadow-v429
  npm run atlas -- relativity kerr-v430-build-count-likelihood
  npm run atlas -- test shadow-v430
  npm run atlas -- evidence shadow-v430
  npm run atlas -- relativity kerr-v431-build-likelihood-stress
  npm run atlas -- test shadow-v431
  npm run atlas -- evidence shadow-v431
  npm run atlas -- relativity kerr-v432-build-likelihood-authority
  npm run atlas -- test shadow-v432
  npm run atlas -- evidence shadow-v432
  npm run atlas -- relativity kerr-v433-build-joint-nuisance
  npm run atlas -- test shadow-v433
  npm run atlas -- evidence shadow-v433
  npm run atlas -- relativity kerr-v434-build-measured-admission
  npm run atlas -- test shadow-v434
  npm run atlas -- evidence shadow-v434
  npm run atlas -- relativity kerr-v435-build-measured-import
  npm run atlas -- test shadow-v435
  npm run atlas -- evidence shadow-v435
  npm run atlas -- relativity kerr-v436-build-observation-provenance
  npm run atlas -- test shadow-v436
  npm run atlas -- evidence shadow-v436
  npm run atlas -- relativity kerr-v437-build-instrument-observation
  npm run atlas -- test shadow-v437
  npm run atlas -- evidence shadow-v437
  npm run atlas -- relativity kerr-v438-build-measured-response-admission
  npm run atlas -- test shadow-v438
  npm run atlas -- evidence shadow-v438
  npm run atlas -- relativity kerr-v439-build-scientific-image-availability
  npm run atlas -- test shadow-v439
  npm run atlas -- evidence shadow-v439
  npm run atlas -- relativity kerr-v440-build-source-coordinate-audit
  npm run atlas -- test shadow-v440
  npm run atlas -- evidence shadow-v440
  npm run atlas -- relativity kerr-v441-build-wcs-projection-availability
  npm run atlas -- test shadow-v441
  npm run atlas -- evidence shadow-v441
  npm run atlas -- relativity kerr-v486-build-runtime|kerr-v520-build-stokes|kerr-v520-build-runtime|kerr-v521-build-oracle|kerr-v521-build-runtime|kerr-v522-build-sensitivity|kerr-v522-build-runtime|kerr-v523-build-analyzer|kerr-v523-build-runtime|kerr-v524-build-identifiability|kerr-v524-build-runtime|kerr-v525-build-calibration-design|kerr-v525-build-runtime|kerr-v526-build-uncertainty-transfer|kerr-v526-build-runtime|kerr-v527-build-budget-frontier|kerr-v527-build-runtime|kerr-v528-build-cost-sensitivity|kerr-v528-build-runtime|kerr-v529-build-cost-law-robustness|kerr-v529-build-runtime|kerr-v530-build-allocation-regret|kerr-v530-build-runtime|kerr-v531-build-regret-ranking|kerr-v531-build-runtime|kerr-v532-build-regret-jackknife|kerr-v533-build-axis-influence|kerr-v533-build-runtime|kerr-v534-build-bandpass-redshift|kerr-v534-build-runtime|kerr-v535-build-bandpass-shift|kerr-v535-build-runtime
  npm run atlas -- test shadow-v485|shadow-v486|shadow-v520|shadow-v521|shadow-v522|shadow-v523|shadow-v524|shadow-v525|shadow-v526|shadow-v527|shadow-v528|shadow-v529|shadow-v530|shadow-v531|shadow-v532|shadow-v533|shadow-v534|shadow-v535
  npm run atlas -- evidence shadow-v485|shadow-v486|shadow-v520|shadow-v521|shadow-v522|shadow-v523|shadow-v524|shadow-v525|shadow-v526|shadow-v527|shadow-v528|shadow-v529|shadow-v530|shadow-v531|shadow-v532|shadow-v533|shadow-v534|shadow-v535
  npm run atlas -- preflight resource-v275r1|resource-v275r2|resource-v300-heavy --inspect|--formal
  npm run atlas -- science-status
  npm run atlas -- local-release standalone|lite
  npm run atlas -- legacy <historical-script> [args]

Legacy commands remain exact and read-only mapped; no command retries science jobs.`);
}

if (domain === "help" || domain === "--help" || domain === "-h") {
  help();
} else if (domain === "build") {
  if (action === "standalone") runNpm("build:atlas:standalone:current", rest);
  else if (action === "lite") runNpm("build:atlas:lite:current", rest);
  else if (action === "local-shadow") run(process.execPath, ["scripts/build-atlas-profile.mjs", "--profile", "local-shadow", "--dist-dir", ".next-atlas-local-shadow-current", "--previous-dist-dir", ".next-atlas-local-shadow-previous", "--rotate", "--preserve-active-dev", ...rest]);
  else throw new Error("build requires standalone, lite or local-shadow");
} else if (domain === "preflight") {
  if (action === "resource-v275r1") run(process.execPath, ["scripts/run-resource-preflight-v275r1.mjs", ...rest]);
  else if (action === "resource-v275r2") run(process.execPath, ["scripts/run-resource-preflight-v275r1.mjs", "--attempt", "v275r2", ...rest]);
  else if (action === "resource-v300-heavy") run(process.execPath, ["scripts/run-resource-preflight-v275r1.mjs", "--attempt", "v300-heavy", ...rest]);
  else throw new Error("preflight requires resource-v275r1, resource-v275r2 or resource-v300-heavy");
} else if (domain === "catalog") {
  if (action === "healpix") run(python, ["scripts/build-catalog-healpix-v8.py", ...rest]);
  else if (action === "healpix-v9") run(python, ["scripts/build-catalog-healpix-v9.py", ...rest]);
  else if (action === "healpix-v10") run(python, ["scripts/build-catalog-healpix-v10.py", ...rest]);
  else if (action === "science") run(python, ["scripts/build-gaia-science-subset-v8.py", ...rest]);
  else if (action === "research-v267") run(python, ["scripts/build-gaia-research-v267.py", ...rest]);
  else if (action === "research-v271") run(python, ["scripts/build-gaia-research-v271.py", ...rest]);
  else if (action === "gaia-10m-fetch-next") run(python, ["scripts/fetch-gaia-presentation-v272.py", ...rest]);
  else if (action === "gaia-10m-fetch-series") run(python, ["scripts/fetch-gaia-presentation-series-v272.py", ...rest]);
  else if (action === "gaia-10m-build") run(python, ["scripts/build-gaia-presentation-v272.py", ...rest]);
  else if (action === "gaia-10m-verify") run(python, ["scripts/verify-gaia-presentation-v272.py", ...rest]);
  else if (action === "cosmic") run(python, ["scripts/build-cosmic-scale-catalogs-v260.py", ...rest]);
  else throw new Error("catalog requires healpix, healpix-v9, healpix-v10, science, research-v267, research-v271, gaia-10m-fetch-next, gaia-10m-fetch-series, gaia-10m-build, gaia-10m-verify or cosmic");
} else if (domain === "relativity") {
  if (action === "reference-v276-build") run(process.execPath, ["scripts/build-relativity-reference-v276.mjs", ...rest]);
  else if (action === "reference-v276-validate") run(process.execPath, ["scripts/validate-relativity-reference-v276.mjs", ...rest]);
  else if (action === "oracle-v276") run(python, ["scripts/run-relativity-oracle-v276.py", ...rest]);
  else if (action === "reference-v282-fetch-missing") run(python, ["scripts/fetch-relativity-reference-v282r1.py", ...rest]);
  else if (action === "reference-v282r2-inspect") run(python, ["scripts/fetch-relativity-reference-v287.py", "--inspect", ...rest]);
  else if (action === "reference-v282r2-fetch-mercury") run(python, ["scripts/fetch-relativity-reference-v287.py", "--fetch", ...rest]);
  else if (action === "reference-v282-run") run(python, ["scripts/run-relativity-reference-v282.py", ...rest]);
  else if (action === "reference-v282-validate") run(process.execPath, ["scripts/validate-relativity-reference-v282.mjs", ...rest]);
  else if (action === "kerr-v277-short-gate") run(process.execPath, ["scripts/build-kerr-reference-v277-short-gate.mjs", ...rest]);
  else if (action === "kerr-v283-short-gate") run(python, ["scripts/run-kerr-short-gate-v283.py", ...rest]);
  else if (action === "kerr-v284-run-next") run(python, ["scripts/run-kerr-dense-campaign-v284.py", "--run-next", ...rest]);
  else if (action === "kerr-v284-run-series") run(python, ["scripts/run-kerr-dense-campaign-v284.py", "--run-series", ...rest]);
  else if (action === "kerr-v284-status") run(python, ["scripts/run-kerr-dense-campaign-v284.py", "--status", ...rest]);
  else if (action === "kerr-v284-aggregate") run(python, ["scripts/run-kerr-dense-campaign-v284.py", "--aggregate", ...rest]);
  else if (action === "kerr-v288-short-gate") run(python, ["scripts/run-kerr-authority-v288.py", "--short-gate", ...rest]);
  else if (action === "kerr-v288-run-next") run(python, ["scripts/run-kerr-dense-campaign-v288r1.py", "--run-next", ...rest]);
  else if (action === "kerr-v288-status") run(python, ["scripts/run-kerr-dense-campaign-v288r1.py", "--status", ...rest]);
  else if (action === "kerr-v291-diagnose") run(python, ["scripts/run-kerr-authority-v291.py", "--diagnose", ...rest]);
  else if (action === "kerr-v292-short-gate") run(python, ["scripts/run-kerr-authority-v291.py", "--short-gate", ...rest]);
  else if (action === "kerr-v293-polarization-gate") run(python, ["scripts/run-kerr-polarization-v293.py", "--gate", ...rest]);
  else if (action === "kerr-v296-diagnose") run(python, ["scripts/run-kerr-authority-v296.py", "--diagnose", ...rest]);
  else if (action === "kerr-v296-short-gate") run(python, ["scripts/run-kerr-authority-v296.py", "--short-gate", ...rest]);
  else if (action === "kerr-v297-polarization-gate") run(python, ["scripts/run-kerr-polarization-v297.py", "--gate", ...rest]);
  else if (action === "kerr-v298-init") run(python, ["scripts/kerr-dense-campaign-v298.py", "--init", ...rest]);
  else if (action === "kerr-v298-status") run(python, ["scripts/kerr-dense-campaign-v298.py", "--status", ...rest]);
  else if (action === "kerr-v298r1-init") run(python, ["scripts/run-kerr-dense-campaign-v298r1.py", "--init", ...rest]);
  else if (action === "kerr-v298r1-status") run(python, ["scripts/run-kerr-dense-campaign-v298r1.py", "--status", ...rest]);
  else if (action === "kerr-v298r1-probe-rss") run(python, ["scripts/run-kerr-dense-campaign-v298r1.py", "--probe-rss", ...rest]);
  else if (action === "kerr-v298r1-run-next") run(python, ["scripts/run-kerr-dense-campaign-v298r1.py", "--run-next", ...rest]);
  else if (action === "kerr-v298r1-run-series") run(python, ["scripts/run-kerr-dense-campaign-v298r1.py", "--run-series", ...rest]);
  else if (action === "kerr-v298r1-audit-published") run(python, ["scripts/run-kerr-dense-campaign-v298r1.py", "--audit-published", ...rest]);
  else if (action === "kerr-v298r1-audit-shard0-v311") run(python, ["scripts/audit-kerr-dense-shard-v311.py", ...rest]);
  else if (action === "kerr-v298r1-aggregate") run(python, ["scripts/run-kerr-dense-campaign-v298r1.py", "--aggregate", ...rest]);
  else if (action === "kerr-v312-inspect") run(python, ["scripts/run-kerr-authority-v312.py", "--inspect", ...rest]);
  else if (action === "kerr-v312-short-gate") run(python, ["scripts/run-kerr-authority-v312.py", "--short-gate", ...rest]);
  else if (action === "kerr-v313-inspect") run(python, ["scripts/run-kerr-polarization-v313.py", "--inspect", ...rest]);
  else if (action === "kerr-v313-polarization-gate") run(python, ["scripts/run-kerr-polarization-v313.py", "--gate", ...rest]);
  else if (action === "kerr-v314-init") run(python, ["scripts/run-kerr-dense-campaign-v314.py", "--init", ...rest]);
  else if (action === "kerr-v314-status") run(python, ["scripts/run-kerr-dense-campaign-v314.py", "--status", ...rest]);
  else if (action === "kerr-v314-aggregate-check") run(python, ["scripts/run-kerr-dense-campaign-v314.py", "--aggregate-check", ...rest]);
  else if (action === "kerr-v314-run-next-dry-run") run(python, ["scripts/run-kerr-dense-campaign-v314.py", "--run-next-dry-run", ...rest]);
  else if (action === "kerr-v314-run-next") run(python, ["scripts/run-kerr-dense-campaign-v314.py", "--run-next", ...rest]);
  else if (action === "kerr-v319-build-spectrum") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-thin-disk-spectrum-v319.ts", ...rest]);
  else if (action === "kerr-v320-build-bands") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-thin-disk-bands-v320.ts", ...rest]);
  else if (action === "kerr-v321-build-raster") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-band-raster-v321.ts", ...rest]);
  else if (action === "kerr-v325-build-uncertainty") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-band-uncertainty-v325.ts", ...rest]);
  else if (action === "kerr-v326-build-provenance") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-uncertainty-provenance-v326.ts", ...rest]);
  else if (action === "kerr-v327-build-ab") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-cinematic-ab-v327.ts", ...rest]);
  else if (action === "kerr-v328-build-photon-bands") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-photon-bands-v328.ts", ...rest]);
  else if (action === "kerr-v331-build-provenance") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-photon-provenance-v331.ts", ...rest]);
  else if (action === "kerr-v332-build-instrument-response") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-instrument-response-v332.ts", ...rest]);
  else if (action === "kerr-v333-build-hud-audit") run(process.execPath, ["scripts/build-kerr-science-observatory-visual-audit-v333.mjs", ...rest]);
  else if (action === "kerr-v334-build-runtime-matrix") run(process.execPath, ["scripts/build-visual-runtime-matrix-v334.mjs", ...rest]);
  else if (action === "kerr-v335-build-lifecycle-replay") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-lifecycle-replay-v335.ts", ...rest]);
  else if (action === "runtime-v336-build-state-replay") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-runtime-state-replay-v336.ts", ...rest]);
  else if (action === "kerr-v337-build-buffer-replay") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-cinematic-buffer-replay-v337.ts", ...rest]);
  else if (action === "provenance-v339-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-relativity-provenance-v339.ts", ...rest]);
  else if (action === "visual-v340-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-visual-runtime-v340.ts", ...rest]);
  else if (action === "observation-v341-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-observation-product-v341.ts", ...rest]);
  else if (action === "observation-raster-v342-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-observation-raster-v342.ts", ...rest]);
  else if (action === "observation-images-v343-build") run(python, ["scripts/build-kerr-science-image-products-v343.py", ...rest]);
  else if (action === "image-lifecycle-v344-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-image-lifecycle-v344.ts", ...rest]);
  else if (action === "image-preview-v345-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-image-preview-replay-v345.ts", ...rest]);
  else if (action === "image-probe-v346-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-image-probe-v346.ts", ...rest]);
  else if (action === "image-roi-v347-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-image-roi-v347.ts", ...rest]);
  else if (action === "band-contrast-v348-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-band-contrast-v348.ts", ...rest]);
  else if (action === "visual-v349-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-visual-runtime-v349.ts", ...rest]);
  else if (action === "band-observation-v350-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-science-band-observation-v350.ts", ...rest]);
  else if (action === "observer-uncertainty-v351-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-observer-frame-uncertainty-v351.ts", ...rest]);
  else if (action === "photon-response-v352-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-photon-response-uncertainty-v352.ts", ...rest]);
  else if (action === "spectral-shape-v353-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-spectral-shape-response-v353.ts", ...rest]);
  else if (action === "spectral-correlation-v354-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-spectral-correlation-response-v354.ts", ...rest]);
  else if (action === "spectral-eigenmodes-v355-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-spectral-eigenmode-audit-v355.ts", ...rest]);
  else if (action === "spectral-envelope-v356-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-spectral-envelope-v356.ts", ...rest]);
  else if (action === "confidence-scale-v357-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-spectral-confidence-scale-v357.ts", ...rest]);
  else if (action === "observable-photons-v358-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-observable-photon-uncertainty-v358.ts", ...rest]);
  else if (action === "counting-noise-v359-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-photon-counting-noise-v359.ts", ...rest]);
  else if (action === "detector-break-even-v360-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-detector-break-even-v360.ts", ...rest]);
  else if (action === "detector-calibration-v361-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-detector-calibration-v361.ts", ...rest]);
  else if (action === "visual-v362-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-visual-runtime-v362.ts", ...rest]);
  else if (action === "detector-calibration-v363-plan") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-detector-calibration-plan-v363.ts", ...rest]);
  else if (action === "detector-calibration-v364-pack") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-detector-calibration-pack-v364.ts", ...rest]);
  else if (action === "detector-calibration-v365-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-detector-calibration-v365.ts", ...rest]);
  else if (action === "detector-calibration-v365-compile") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/compile-detector-calibration-v365.ts", ...rest]);
  else if (action === "detector-calibration-v366-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-detector-calibration-v366.ts", ...rest]);
  else if (action === "detector-calibration-v367-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-detector-calibration-v367.ts", ...rest]);
  else if (action === "detector-calibration-v367-admit") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/admit-detector-calibration-v367.ts", ...rest]);
  else if (action === "detector-response-v368-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-detector-response-v368.ts", ...rest]);
  else if (action === "measured-expectation-v369-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-measured-photon-expectation-v369.ts", ...rest]);
  else if (action === "observation-geometry-v370-pack") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-observation-geometry-pack-v370.ts", ...rest]);
  else if (action === "visual-v370-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-visual-runtime-v370.ts", ...rest]);
  else if (action === "observation-geometry-v371-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-observation-geometry-v371.ts", ...rest]);
  else if (action === "observation-geometry-v371-compile") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/compile-observation-geometry-v371.ts", ...rest]);
  else if (action === "observation-geometry-v372-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-observation-geometry-v372.ts", ...rest]);
  else if (action === "observation-geometry-v372-validate") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/validate-observation-geometry-v372.ts", ...rest]);
  else if (action === "observation-geometry-v373-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-observation-geometry-v373.ts", ...rest]);
  else if (action === "observation-geometry-v373-admit") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/admit-observation-geometry-v373.ts", ...rest]);
  else if (action === "observation-geometry-v374-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-observation-geometry-v374.ts", ...rest]);
  else if (action === "observation-geometry-v374-publish") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/publish-observation-geometry-v374.ts", ...rest]);
  else if (action === "measured-expectation-v375-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-measured-expectation-v375.ts", ...rest]);
  else if (action === "measured-expectation-v375-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measured-expectation-v375.ts", ...rest]);
  else if (action === "expected-electron-image-v376-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/inspect-expected-electron-image-v376.ts", ...rest]);
  else if (action === "expected-electron-image-v376-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-expected-electron-image-v376.ts", ...rest]);
  else if (action === "visual-v377-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-visual-runtime-v377.ts", ...rest]);
  else if (action === "measurement-authority-v378-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measurement-authority-topology-v378.ts", ...rest]);
  else if (action === "measurement-authority-v379-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measured-authority-readiness-v379.ts", ...rest]);
  else if (action === "measurement-authority-v380-adversarial") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measured-authority-adversarial-v380.ts", ...rest]);
  else if (action === "measurement-authority-v381-audit") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measured-authority-identity-v381.ts", ...rest]);
  else if (action === "measurement-authority-v382-fetch-visible") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/fetch-measured-visible-source-v382.ts", ...rest]);
  else if (action === "measurement-authority-v382r1-forensic") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measured-visible-source-forensic-v382r1.ts", ...rest]);
  else if (action === "measurement-authority-v383-oracle") run(python, ["scripts/run-measured-visible-throughput-oracle-v383.py", ...rest]);
  else if (action === "measurement-authority-v383-normalize-visible") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measured-visible-throughput-v383.ts", ...rest]);
  else if (action === "measurement-authority-v384-oracle") run(python, ["scripts/run-measured-visible-photon-oracle-v384.py", ...rest]);
  else if (action === "measurement-authority-v384-build-photon-observable") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measured-visible-photon-observable-v384.ts", ...rest]);
  else if (action === "measurement-authority-v385-oracle") run(python, ["scripts/run-measured-visible-photon-error-budget-oracle-v385.py", ...rest]);
  else if (action === "measurement-authority-v385-build-error-budget") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measured-visible-photon-error-budget-v385.ts", ...rest]);
  else if (action === "measurement-authority-v386-oracle") run(python, ["scripts/run-measured-visible-photon-sensitivity-oracle-v386.py", ...rest]);
  else if (action === "measurement-authority-v386-build-sensitivity") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-measured-visible-photon-sensitivity-v386.ts", ...rest]);
  else if (action === "measurement-authority-v387-oracle") run(python, ["scripts/run-kerr-photon-source-identifiability-oracle-v387.py", ...rest]);
  else if (action === "measurement-authority-v387-build-identifiability") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-photon-source-identifiability-v387.ts", ...rest]);
  else if (action === "measurement-authority-v388-oracle") run(python, ["scripts/run-kerr-geometry-conditioned-temperature-oracle-v388.py", ...rest]);
  else if (action === "measurement-authority-v388-build-conditioned-temperature") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-geometry-conditioned-temperature-v388.ts", ...rest]);
  else if (action === "measurement-authority-v389-oracle") run(python, ["scripts/run-kerr-conditional-temperature-interval-oracle-v389.py", ...rest]);
  else if (action === "measurement-authority-v389-build-temperature-interval") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-conditional-temperature-interval-v389.ts", ...rest]);
  else if (action === "measurement-authority-v390-oracle") run(python, ["scripts/run-kerr-temperature-systematics-transfer-oracle-v390.py", ...rest]);
  else if (action === "measurement-authority-v390-build-systematics-transfer") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-temperature-systematics-transfer-v390.ts", ...rest]);
  else if (action === "measurement-authority-v391-oracle") run(python, ["scripts/run-kerr-temperature-trust-region-oracle-v391.py", ...rest]);
  else if (action === "measurement-authority-v391-build-trust-region") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-temperature-trust-region-v391.ts", ...rest]);
  else if (action === "measurement-authority-v392-oracle") run(python, ["scripts/run-kerr-physical-covariance-oracle-v392.py", ...rest]);
  else if (action === "measurement-authority-v392-build-covariance-admission") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-physical-covariance-admission-v392.ts", ...rest]);
  else if (action === "measurement-authority-v393-oracle") run(python, ["scripts/run-kerr-covariance-source-oracle-v393.py", ...rest]);
  else if (action === "measurement-authority-v393-build-source-dossier") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-covariance-source-admission-v393.ts", ...rest]);
  else if (action === "measurement-authority-v394-oracle") run(python, ["scripts/run-kerr-global-covariance-oracle-v394.py", ...rest]);
  else if (action === "measurement-authority-v394-build-global-covariance") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-global-covariance-propagation-v394.ts", ...rest]);
  else if (action === "measurement-authority-v395-oracle") run(python, ["scripts/run-kerr-global-observability-oracle-v395.py", ...rest]);
  else if (action === "measurement-authority-v395-build-observability") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-global-observability-v395.ts", ...rest]);
  else if (action === "measurement-authority-v396-oracle") run(python, ["scripts/run-kerr-auxiliary-constraint-oracle-v396.py", ...rest]);
  else if (action === "measurement-authority-v396-build-design") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-auxiliary-constraint-design-v396.ts", ...rest]);
  else if (action === "measurement-authority-v397-oracle") run(python, ["scripts/run-kerr-physical-observation-admission-oracle-v397.py", ...rest]);
  else if (action === "measurement-authority-v397-build-admission") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-physical-observation-admission-v397.ts", ...rest]);
  else if (action === "measurement-authority-v398-inspect") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-physical-observation-intake-v398.ts", ...rest]);
  else if (action === "measurement-authority-v398-compile") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/compile-kerr-physical-observation-v398.ts", ...rest]);
  else if (action === "measurement-authority-v399-build-template") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-physical-observation-template-v399.ts", ...rest]);
  else if (action === "visual-v400-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-observation-hub-v400.ts", ...rest]);
  else if (action === "observation-v401-build") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-observation-evidence-cache-v401.ts", ...rest]);
  else if (action === "observation-v402-build-lifecycle") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-observation-evidence-lifecycle-v402.ts", ...rest]);
  else if (action === "observation-v403-replay") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/run-atlas-observation-evidence-lifecycle-v403.ts", ...rest]);
  else if (action === "observation-v404-build-summary") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-observation-lifecycle-summary-v404.ts", ...rest]);
  else if (action === "observation-v405-build-dossier") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-atlas-evidence-observatory-v405.ts", ...rest]);
  else if (action === "kerr-v406-build-stokes") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-stokes-transfer-v406.ts", ...rest]);
  else if (action === "kerr-v407-build-scattering") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-scattering-atmosphere-v407.ts", ...rest]);
  else if (action === "kerr-v408-build-oracle") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-scattering-oracle-v408.ts", ...rest]);
  else if (action === "kerr-v409-build-correction") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-scattering-corrected-v409.ts", ...rest]);
  else if (action === "kerr-v410-build-polarimeter") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-ideal-polarimeter-v410.ts", ...rest]);
  else if (action === "kerr-v411-build-calibration-contract") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-polarimeter-calibration-v411.ts", ...rest]);
  else if (action === "kerr-v412-build-inversion") run(process.execPath, ["scripts/build-kerr-polarimeter-inversion-chain-v412.mjs", ...rest]);
  else if (action === "kerr-v413-build-spectral-response") run(process.execPath, ["scripts/build-kerr-polarimeter-spectral-chain-v413.mjs", ...rest]);
  else if (action === "kerr-v414-build-detector-counts") run(process.execPath, ["scripts/build-kerr-polarimeter-detector-chain-v414.mjs", ...rest]);
  else if (action === "kerr-v415-build-detector-likelihood") run(process.execPath, ["scripts/build-kerr-polarimeter-detector-likelihood-chain-v415.mjs", ...rest]);
  else if (action === "kerr-v416-build-stokes-ensemble") run(process.execPath, ["scripts/build-kerr-polarimeter-stokes-ensemble-chain-v416.mjs", ...rest]);
  else if (action === "kerr-v417-build-nonlinear-observables") run(process.execPath, ["scripts/build-kerr-polarimeter-nonlinear-chain-v417.mjs", ...rest]);
  else if (action === "kerr-v418-build-sparse-polarimetry") run(process.execPath, ["scripts/build-kerr-sparse-polarimetric-chain-v418.mjs", ...rest]);
  else if (action === "kerr-v419-build-screen-coordinates") run(process.execPath, ["scripts/build-kerr-screen-coordinate-chain-v419.mjs", ...rest]);
  else if (action === "kerr-v420-build-observer-wcs") run(process.execPath, ["scripts/build-kerr-observer-plane-WCS-chain-v420.mjs", ...rest]);
  else if (action === "kerr-v421-build-axial-vectors") run(process.execPath, ["scripts/build-kerr-axial-polarization-chain-v421.mjs", ...rest]);
  else if (action === "kerr-v422-build-orientation-basis") run(process.execPath, ["scripts/build-kerr-orientation-basis-chain-v422.mjs", ...rest]);
  else if (action === "kerr-v423-build-predicted-stokes") run(process.execPath, ["scripts/build-kerr-predicted-stokes-admission-chain-v423.mjs", ...rest]);
  else if (action === "kerr-v424-build-predicted-polarimeter") run(process.execPath, ["scripts/build-kerr-predicted-polarimeter-chain-v424.mjs", ...rest]);
  else if (action === "kerr-v425-build-spectral-admission") run(process.execPath, ["scripts/build-kerr-instrument-spectral-admission-chain-v425.mjs", ...rest]);
  else if (action === "kerr-v426-build-high-energy-response") run(process.execPath, ["scripts/build-kerr-high-energy-response-chain-v426.mjs", ...rest]);
  else if (action === "kerr-v427-build-response-acquisition-pack") run(process.execPath, ["scripts/build-kerr-high-energy-response-acquisition-chain-v427.mjs", ...rest]);
  else if (action === "kerr-v428-build-response-intake") run(process.execPath, ["scripts/build-kerr-high-energy-response-intake-chain-v428.mjs", ...rest]);
  else if (action === "kerr-v428-validate-response-submission") run("python", ["scripts/kerr-high-energy-response-intake-v428.py", ...rest]);
  else if (action === "kerr-v429-build-response-uncertainty") run(process.execPath, ["scripts/build-kerr-high-energy-response-uncertainty-chain-v429.mjs", ...rest]);
  else if (action === "kerr-v430-build-count-likelihood") run(process.execPath, ["scripts/build-kerr-high-energy-count-likelihood-chain-v430.mjs", ...rest]);
  else if (action === "kerr-v431-build-likelihood-stress") run(process.execPath, ["scripts/build-kerr-high-energy-likelihood-stress-chain-v431.mjs", ...rest]);
  else if (action === "kerr-v432-build-likelihood-authority") run(process.execPath, ["scripts/build-kerr-high-energy-likelihood-authority-chain-v432.mjs", ...rest]);
  else if (action === "kerr-v433-build-joint-nuisance") run(process.execPath, ["scripts/build-kerr-high-energy-joint-nuisance-chain-v433.mjs", ...rest]);
  else if (action === "kerr-v434-build-measured-admission") run(process.execPath, ["scripts/build-kerr-high-energy-measured-admission-chain-v434.mjs", ...rest]);
  else if (action === "kerr-v435-build-measured-import") run(process.execPath, ["scripts/build-kerr-high-energy-measured-import-chain-v435.mjs", ...rest]);
  else if (action === "kerr-v436-build-observation-provenance") run(process.execPath, ["scripts/build-kerr-observation-provenance-chain-v436.mjs", ...rest]);
  else if (action === "kerr-v437-build-instrument-observation") run(process.execPath, ["scripts/build-kerr-instrument-observation-chain-v437.mjs", ...rest]);
  else if (action === "kerr-v438-build-measured-response-admission") run(process.execPath, ["scripts/build-kerr-measured-response-admission-chain-v438.mjs", ...rest]);
  else if (action === "kerr-v439-build-scientific-image-availability") run(process.execPath, ["scripts/build-kerr-scientific-image-availability-chain-v439.mjs", ...rest]);
  else if (action === "kerr-v440-build-source-coordinate-audit") run(process.execPath, ["scripts/build-kerr-source-coordinate-audit-chain-v440.mjs", ...rest]);
  else if (action === "kerr-v441-build-wcs-projection-availability") run(process.execPath, ["scripts/build-kerr-wcs-projection-availability-chain-v441.mjs", ...rest]);
  else if (action === "detector-calibration-v504-preflight") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-measured-calibration-preflight-v504.ts", ...rest]);
  else if (action === "kerr-v486-build-runtime") run(process.execPath, ["scripts/build-kerr-photon-metrology-runtime-v486.mjs", ...rest]);
  else if (action === "kerr-v520-build-stokes") run("python", ["scripts/run-kerr-fixed-band-stokes-v520.py", ...rest]);
  else if (action === "kerr-v520-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-fixed-band-stokes-runtime-v520.ts", ...rest]);
  else if (action === "kerr-v521-build-oracle") run("python", ["scripts/run-kerr-fixed-band-stokes-oracle-v521.py", ...rest]);
  else if (action === "kerr-v521-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-fixed-band-stokes-oracle-runtime-v521.ts", ...rest]);
  else if (action === "kerr-v522-build-sensitivity") run("python", ["scripts/run-kerr-polarization-frequency-sensitivity-v522.py", ...rest]);
  else if (action === "kerr-v522-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-polarization-frequency-sensitivity-runtime-v522.ts", ...rest]);
  else if (action === "kerr-v523-build-analyzer") run("python", ["scripts/run-kerr-ideal-analyzer-sensitivity-v523.py", ...rest]);
  else if (action === "kerr-v523-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-ideal-analyzer-sensitivity-runtime-v523.ts", ...rest]);
  else if (action === "kerr-v524-build-identifiability") run("python", ["scripts/run-kerr-analyzer-identifiability-v524.py", ...rest]);
  else if (action === "kerr-v524-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-analyzer-identifiability-runtime-v524.ts", ...rest]);
  else if (action === "kerr-v525-build-calibration-design") run("python", ["scripts/run-kerr-calibration-excitation-design-v525.py", ...rest]);
  else if (action === "kerr-v525-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-calibration-excitation-design-runtime-v525.ts", ...rest]);
  else if (action === "kerr-v526-build-uncertainty-transfer") run("python", ["scripts/run-kerr-calibration-uncertainty-transfer-v526.py", ...rest]);
  else if (action === "kerr-v526-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-calibration-uncertainty-transfer-runtime-v526.ts", ...rest]);
  else if (action === "kerr-v527-build-budget-frontier") run("python", ["scripts/run-kerr-calibration-budget-frontier-v527.py", ...rest]);
  else if (action === "kerr-v527-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-calibration-budget-frontier-runtime-v527.ts", ...rest]);
  else if (action === "kerr-v528-build-cost-sensitivity") run("python", ["scripts/run-kerr-calibration-cost-sensitivity-v528.py", ...rest]);
  else if (action === "kerr-v528-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-calibration-cost-sensitivity-runtime-v528.ts", ...rest]);
  else if (action === "kerr-v529-build-cost-law-robustness") run("python", ["scripts/run-kerr-cost-law-robustness-v529.py", ...rest]);
  else if (action === "kerr-v529-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-cost-law-robustness-runtime-v529.ts", ...rest]);
  else if (action === "kerr-v530-build-allocation-regret") run("python", ["scripts/run-kerr-allocation-regret-v530.py", ...rest]);
  else if (action === "kerr-v530-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-allocation-regret-runtime-v530.ts", ...rest]);
  else if (action === "kerr-v531-build-regret-ranking") run("python", ["scripts/run-kerr-regret-ranking-v531.py", ...rest]);
  else if (action === "kerr-v531-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-regret-ranking-runtime-v531.ts", ...rest]);
  else if (action === "kerr-v532-build-regret-jackknife") run("python", ["scripts/run-kerr-regret-jackknife-v532.py", ...rest]);
  else if (action === "kerr-v532-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-regret-jackknife-runtime-v532.ts", ...rest]);
  else if (action === "kerr-v533-build-axis-influence") run("python", ["scripts/run-kerr-grid-axis-influence-v533.py", ...rest]);
  else if (action === "kerr-v533-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-grid-axis-influence-runtime-v533.ts", ...rest]);
  else if (action === "kerr-v534-build-bandpass-redshift") run(process.execPath, ["scripts/build-kerr-bandpass-redshift-commutator-v534.mjs", ...rest]);
  else if (action === "kerr-v534-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-bandpass-redshift-runtime-v534.ts", ...rest]);
  else if (action === "kerr-v535-build-bandpass-shift") run(process.execPath, ["scripts/build-kerr-bandpass-shift-jacobian-v535.mjs", ...rest]);
  else if (action === "kerr-v535-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-bandpass-shift-runtime-v535.ts", ...rest]);
  else if (action === "kerr-v536-build-sparse-image") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-aware-sparse-image-v536.ts", ...rest]);
  else if (action === "kerr-v536-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-aware-sparse-runtime-v536.ts", ...rest]);
  else if (action === "kerr-v537-export-sparse-fits") run("python", ["scripts/export-kerr-response-aware-sparse-fits-v537.py", ...rest]);
  else if (action === "kerr-v537-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-aware-sparse-fits-runtime-v537.ts", ...rest]);
  else if (action === "kerr-v538-build-column-schema") run("python", ["scripts/build-kerr-response-aware-fits-column-schema-v538.py", ...rest]);
  else if (action === "kerr-v538-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-aware-fits-column-schema-runtime-v538.ts", ...rest]);
  else if (action === "kerr-v539-build-portable-crate") run("python", ["scripts/build-kerr-response-aware-portable-crate-v539.py", ...rest]);
  else if (action === "kerr-v539-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-aware-portable-crate-runtime-v539.ts", ...rest]);
  else if (action === "kerr-v540-build-offline-replay") run("python", ["scripts/build-kerr-response-aware-offline-replay-v540.py", ...rest]);
  else if (action === "kerr-v540-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-aware-offline-replay-runtime-v540.ts", ...rest]);
  else if (action === "kerr-v541-build-replay-kit") run("python", ["scripts/build-kerr-response-aware-replay-kit-v541.py", ...rest]);
  else if (action === "kerr-v541-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-aware-replay-kit-runtime-v541.ts", ...rest]);
  else if (action === "kerr-v542-build-compatibility") run("python", ["scripts/build-kerr-replay-compatibility-v542.py", ...rest]);
  else if (action === "kerr-v542-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-replay-compatibility-runtime-v542.ts", ...rest]);
  else if (action === "kerr-v543-build-isolated-preflight") run("python", ["scripts/build-kerr-replay-isolated-preflight-v543.py", ...rest]);
  else if (action === "kerr-v543-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-replay-isolated-preflight-runtime-v543.ts", ...rest]);
  else if (action === "kerr-v544-build-calibration-gap") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-calibration-authority-gap-v544.ts", ...rest]);
  else if (action === "kerr-v544-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-calibration-authority-gap-runtime-v544.ts", ...rest]);
  else if (action === "kerr-v545-build-supplemental-intake") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-supplemental-calibration-intake-v545.ts", ...rest]);
  else if (action === "kerr-v545-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-supplemental-calibration-runtime-v545.ts", ...rest]);
  else if (action === "kerr-v546-build-fits-validation") run("python", ["scripts/build-kerr-independent-fits-validation-v546.py", ...rest]);
  else if (action === "kerr-v546-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-independent-fits-runtime-v546.ts", ...rest]);
  else if (action === "kerr-v547-build-blind-review") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-blind-authority-review-v547.ts", ...rest]);
  else if (action === "kerr-v547-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-blind-authority-review-runtime-v547.ts", ...rest]);
  else if (action === "kerr-v548-build-provenance") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-observation-quantity-provenance-v548.ts", ...rest]);
  else if (action === "kerr-v548-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-observation-quantity-provenance-runtime-v548.ts", ...rest]);
  else if (action === "kerr-v549-build-sidecar") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-measured-sidecar-admission-v549.ts", ...rest]);
  else if (action === "kerr-v549-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-measured-sidecar-runtime-v549.ts", ...rest]);
  else if (action === "kerr-v550-build-pack") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-measured-pack-manifest-v550.ts", ...rest]);
  else if (action === "kerr-v550-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-measured-pack-runtime-v550.ts", ...rest]);
  else if (action === "kerr-v551-build-confirmation") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-license-confirmation-v551.ts", ...rest]);
  else if (action === "kerr-v551-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-license-confirmation-runtime-v551.ts", ...rest]);
  else if (action === "kerr-v552-build-packet") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-license-confirmation-packet-v552.ts", ...rest]);
  else if (action === "kerr-v552-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-license-confirmation-packet-runtime-v552.ts", ...rest]);
  else if (action === "kerr-v553-build-join") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-observation-authority-join-v553.ts", ...rest]);
  else if (action === "kerr-v553-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-observation-authority-join-runtime-v553.ts", ...rest]);
  else if (action === "kerr-v555-build-image") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-sparse-science-image-v555.ts", ...rest]);
  else if (action === "kerr-v555-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-sparse-science-image-runtime-v555.ts", ...rest]);
  else if (action === "kerr-v556-build-products") run(resolve(projectRoot, ".venv-science/Scripts/python.exe"), ["scripts/build-kerr-sparse-science-image-products-v556.py", ...rest]);
  else if (action === "kerr-v556-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-sparse-science-image-products-runtime-v556.ts", ...rest]);
  else if (action === "kerr-v557-build-products") run(resolve(projectRoot, ".venv-science/Scripts/python.exe"), ["scripts/build-kerr-sparse-coordinate-products-v557.py", ...rest]);
  else if (action === "kerr-v557-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-sparse-coordinate-products-runtime-v557.ts", ...rest]);
  else if (action === "kerr-v558-build-pack") run(resolve(projectRoot, ".venv-science/Scripts/python.exe"), ["scripts/build-kerr-response-provenance-pack-v558.py", ...rest]);
  else if (action === "kerr-v558-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-response-provenance-runtime-v558.ts", ...rest]);
  else if (action === "kerr-v559-build-ledger") run(resolve(projectRoot, ".venv-science/Scripts/python.exe"), ["scripts/build-kerr-uncertainty-ledger-pack-v559.py", ...rest]);
  else if (action === "kerr-v559-build-runtime") run(process.execPath, [resolve(projectRoot, "node_modules/tsx/dist/cli.mjs"), "scripts/build-kerr-uncertainty-ledger-runtime-v559.ts", ...rest]);
  else if (action === "kerr-v560-build-envelope") run(resolve(projectRoot, ".venv-science/Scripts/python.exe"), ["scripts/build-kerr-observation-envelope-v560.py", ...rest]);
  else if (action === "kerr-v279-init") run(process.execPath, ["scripts/init-kerr-campaign-v279.mjs", ...rest]);
  else throw new Error("relativity requires a supported v276/v282/v277/v283/v284/v288/v291/v292/v293/v296/v297/v298/v312/v313/v314/v319/v320/v321/v325/v326/v327/v328/v331/v332/v333/v334/v335/v336/v396/v418/v419/v420/v421/v422/v423/v424/v425/v426/v427/v428/v429/v430/v431/v432/v433/v434/v435/v436/v437/v438/v439/v440/v441/v486/v504/v520/v521/v522/v523/v524/v525/v526/v527/v528/v529/v530/v531/v532/v533/v534/v535/v536/v537/v538/v539/v540/v541/v542/v543/v544/v545/v546/v547/v548/v549/v550/v551/v552/v553/v555/v556/v557/v558/v559/v560 action");
} else if (domain === "assets") {
  if (action === "visual-v274") run(process.execPath, ["scripts/build-visual-assets-v274.mjs", ...rest]);
  else if (action === "cinematic-v280") run(process.execPath, ["scripts/build-shadow-candidate-v280.mjs", ...rest]);
  else if (action === "cinematic-v289-stage") run(process.execPath, ["scripts/stage-cinematic-assets-v289.mjs", ...rest]);
  else if (action === "cinematic-v299-stage") run(process.execPath, ["scripts/stage-cinematic-assets-v299.mjs", ...rest]);
  else throw new Error("assets requires visual-v274, cinematic-v280, cinematic-v289-stage or cinematic-v299-stage");
} else if (domain === "test") {
  if (action === "types") run(process.execPath, [resolve(projectRoot, "node_modules/typescript/bin/tsc"), "--noEmit", ...rest]);
  else if (action === "full") runNpm("test:atlas", rest);
  else if (action === "v271-recovery") run(python, ["scripts/test-gaia-research-v271.py", ...rest]);
  else if (action === "shadow-v270") run(process.execPath, ["scripts/verify-shadow-v270-light.mjs", ...rest]);
  else if (action === "shadow-v275") run(process.execPath, ["scripts/verify-shadow-v275-light.mjs", ...rest]);
  else if (action === "shadow-v285r1") run(process.execPath, ["scripts/verify-shadow-v285r1-light.mjs", ...rest]);
  else if (action === "shadow-v290") run(process.execPath, ["scripts/verify-shadow-v290-light.mjs", ...rest]);
  else if (action === "shadow-v295") run(process.execPath, ["scripts/verify-shadow-v295-light.mjs", ...rest]);
  else if (action === "shadow-v296") run(process.execPath, ["scripts/verify-shadow-v296-light.mjs", ...rest]);
  else if (action === "focused") run(process.execPath, [resolve(projectRoot, "node_modules/vitest/vitest.mjs"), "run",
    "app/lib/atlasRuntimeStateV256.test.ts",
    "app/lib/atlasDeliveryProfile.test.ts",
    "app/lib/atlasUnifiedCliV256.test.ts",
    "app/components/atlasAuthoredReactLineBudgetV256.test.ts",
    "app/components/atlasRuntimeWorkbenchDomains.test.ts",
    "app/lib/catalogTileV8.test.ts",
    "app/lib/catalogTileV8.generated.test.ts",
    "app/lib/observationPlannerV1.test.ts",
    "app/lib/observationPlannerV2.test.ts",
    "app/lib/gaiaScienceV8.test.ts",
    "app/lib/gaiaScienceV8.generated.test.ts",
    "app/lib/relativityReferenceV276.test.ts",
    "app/lib/relativityReferenceV282.test.ts",
    "app/lib/relativityReferenceFetchV282R1.test.ts",
    "app/lib/relativityReferenceV287.test.ts",
    "app/lib/kerrReferenceV277.test.ts",
    "app/lib/kerrGpuComputeV283.test.ts",
    "app/lib/kerrCampaignV284.test.ts",
    "app/lib/strongGravityRenderingV278.test.ts",
    "app/lib/kerrCampaignV279.test.ts",
    "app/lib/relativityWorkbenchV280.test.ts",
    "app/lib/relativityWorkbenchEvidenceV285.test.ts",
    "app/lib/relativityEvidenceServerV285R1.test.ts",
    "app/api/atlas/relativity-evidence/route.test.ts",
    "app/lib/atlasVisualProfileV285.test.ts",
    "app/lib/atlasVisualRuntimeTokenAuditV285R1.test.ts",
    "app/lib/atlasVisualRuntimeConsumptionV300.test.ts",
    "app/lib/atlasV286RuntimeOptimization.test.ts",
   "app/lib/kerrAuthorityV291.test.ts",
   "app/lib/kerrAuthorityV296.test.ts",
     "app/lib/kerrAuthorityV297.test.ts",
     "app/lib/kerrCampaignV298.test.ts",
     "app/lib/kerrCampaignV298R1.test.ts",
     "app/lib/kerrCriticalCurveV300.test.ts",
     "app/lib/kerrCriticalCurvePlotV300.test.ts",
     "app/lib/kerrObserverEmitterReplayV301.test.ts",
     "app/lib/kerrEventTimelineV302.test.ts",
     "app/lib/kerrErrorBudgetV303.test.ts",
     "app/lib/kerrPolarizationViewV304.test.ts",
     "app/lib/strongGravityRenderingV299.test.ts",
     "app/lib/kerrStrongGravityVisualV305.test.ts",
     "app/lib/kerrScienceObservablesV306.test.ts",
     "app/lib/kerrScienceRasterV307.test.ts",
     "app/lib/atlasResourceScopeV308.test.ts",
     "app/lib/atlasStrongGravityTelemetryV309.test.ts",
     "app/lib/atlasStrongGravityBrowserGateV310.test.ts",
     "app/lib/kerrDenseShardTruthV311.test.ts",
     "app/lib/kerrAuthorityV312.test.ts",
     "app/lib/kerrAuthorityV313.test.ts",
     "app/lib/kerrCampaignV314.test.ts",
     "app/lib/kerrInteractiveComputeV299.test.ts",
     "app/lib/kerrSciencePayloadClientV299.test.ts",
      "app/lib/atlasVisualProfileV299.test.ts",
      "app/lib/atlasShadowCapabilityPointerV299.test.ts",
      "app/lib/atlasShadowCapabilityPointerV312.test.ts",
      "app/lib/atlasShadowCapabilityPointerV313.test.ts",
      "app/lib/atlasShadowCapabilityPointerV314.test.ts",
      "app/lib/atlasShadowHeavyQualificationGateV300.test.ts",
    "app/lib/atlasResourcePreflightV300.test.ts",
    "app/lib/atlasPerformanceQualificationV300.test.ts",
     "app/api/atlas/relativity-evidence/artifacts/[artifact]/route.test.ts",
    "app/lib/atlasBrowserObservabilityV294.test.ts",
    "app/lib/atlasShadowCapabilityPointerV295.test.ts",
    "app/lib/atlasShadowCapabilityPointerV296.test.ts",
    "app/lib/atlasVisualAssetsV289.test.ts",
    "app/lib/atlasResourceLifecycleV275.test.ts",
    "app/components/GalaxyEnvironmentProfileV281.test.ts",
    "app/lib/atlasScaleBandsV260.test.ts",
    "app/lib/cosmicScaleCatalogsV260.generated.test.ts",
     "app/lib/atlasVisualProfileV261.test.ts",
     "app/lib/relativityWorkbenchEvidenceV330.test.ts",
     "app/api/atlas/relativity-evidence/v330/route.test.ts",
     "app/lib/atlasShadowCapabilityPointerV330.test.ts",
     "app/lib/kerrSciencePhotonProvenanceV331.test.ts",
     "app/lib/kerrSciencePhotonProvenanceV331.generated.test.ts",
     "app/lib/atlasShadowCapabilityPointerV331.test.ts",
     "app/lib/kerrScienceInstrumentResponseV332.test.ts",
     "app/lib/kerrScienceInstrumentResponseV332.generated.test.ts",
     "app/lib/atlasShadowCapabilityPointerV332.test.ts",
     "app/components/KerrScienceObservatoryHeaderV333.test.ts",
     "app/lib/atlasShadowCapabilityPointerV333.test.ts",
     "app/lib/atlasVisualRuntimeMatrixV334.test.ts",
     "app/lib/atlasShadowCapabilityPointerV334.test.ts",
     "app/lib/atlasResourceLifecycleReplayV335.test.ts",
     "app/lib/atlasShadowCapabilityPointerV335.test.ts",
     "app/lib/atlasRuntimeStateReplayV336.test.ts",
     "app/lib/atlasShadowCapabilityPointerV336.test.ts",
     "app/lib/kerrScienceCinematicBufferReplayV337.test.ts",
     "app/lib/atlasShadowCapabilityPointerV337.test.ts",
     "app/lib/relativityWorkbenchEvidenceV338.test.ts",
     "app/lib/relativityEvidenceServerV338.test.ts",
     "app/api/atlas/relativity-evidence/v338/route.test.ts",
     "app/lib/atlasShadowCapabilityPointerV338.test.ts",
     "app/lib/relativityProvenanceV339.test.ts",
     "app/lib/atlasShadowCapabilityPointerV339.test.ts",
     "app/lib/atlasVisualRuntimeMatrixV340.test.ts",
     "app/lib/kerrScienceCinematicV7V340.test.ts",
     "app/lib/atlasShadowCapabilityPointerV340.test.ts",
     "app/lib/kerrScienceObservationProductV341.test.ts",
     "app/lib/atlasShadowCapabilityPointerV341.test.ts",
     "app/lib/relativityEvidenceServerV341.test.ts",
     "app/api/atlas/relativity-evidence/v341/route.test.ts",
     "app/lib/kerrScienceObservationRasterV342.test.ts",
     "app/lib/atlasShadowCapabilityPointerV342.test.ts",
     "app/lib/relativityEvidenceServerV342.test.ts",
     "app/api/atlas/relativity-evidence/v342/route.test.ts",
     "app/lib/kerrScienceImageProductsV343.test.ts",
     "app/lib/kerrScienceImageProductServerV343.test.ts",
     "app/lib/atlasShadowCapabilityPointerV343.test.ts",
     "app/lib/relativityEvidenceServerV343.test.ts",
     "app/api/atlas/relativity-evidence/v343/route.test.ts",
     "app/api/atlas/relativity-evidence/v343/products/[product]/route.test.ts",
     "app/lib/kerrScienceImageProductLifecycleV344.test.ts",
     "app/lib/atlasShadowCapabilityPointerV344.test.ts",
     "app/lib/relativityEvidenceServerV344.test.ts",
     "app/api/atlas/relativity-evidence/v344/route.test.ts",
     "app/lib/atlasScienceImagePreviewTelemetryV345.test.ts",
     "app/lib/kerrScienceImagePreviewReplayV345.test.ts",
     "app/lib/atlasShadowCapabilityPointerV345.test.ts",
     "app/lib/relativityEvidenceServerV345.test.ts",
     "app/api/atlas/relativity-evidence/v345/route.test.ts",
     "app/lib/kerrScienceImagePixelProbeV346.test.ts",
     "app/lib/kerrScienceImageProbeClientV346.test.ts",
     "app/lib/kerrScienceImageProbeServerV346.test.ts",
     "app/lib/atlasScienceImageProbeTelemetryV346.test.ts",
     "app/lib/atlasShadowCapabilityPointerV346.test.ts",
     "app/lib/relativityEvidenceServerV346.test.ts",
     "app/api/atlas/relativity-evidence/v346/route.test.ts",
     "app/api/atlas/relativity-evidence/v346/probe/route.test.ts",
     "app/lib/kerrScienceImageRoiV347.test.ts",
     "app/lib/kerrScienceImageRoiExportV347.test.ts",
     "app/lib/atlasScienceImageRoiTelemetryV347.test.ts",
     "app/lib/atlasShadowCapabilityPointerV347.test.ts",
     "app/lib/relativityEvidenceServerV347.test.ts",
     "app/api/atlas/relativity-evidence/v347/route.test.ts",
     "app/lib/kerrScienceBandContrastV348.test.ts",
     "app/lib/kerrScienceBandContrastExportV348.test.ts",
     "app/lib/kerrScienceBandContrastServerV348.test.ts",
     "app/lib/kerrScienceBandContrastClientV348.test.ts",
     "app/lib/atlasScienceBandContrastTelemetryV348.test.ts",
     "app/lib/atlasShadowCapabilityPointerV348.test.ts",
     "app/lib/relativityEvidenceServerV348.test.ts",
     "app/api/atlas/relativity-evidence/v348/route.test.ts",
     "app/api/atlas/relativity-evidence/v348/diagnostic/route.test.ts",
     "app/lib/atlasVisualRuntimeMatrixV349.test.ts",
     "app/lib/kerrScienceCinematicV8V349.test.ts",
     "app/components/KerrSpectralObservatoryRibbonV349.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV349.test.ts",
     "app/lib/relativityEvidenceServerV349.test.ts",
     "app/api/atlas/relativity-evidence/v349/route.test.ts",
     "app/lib/kerrScienceBandObservationV350.test.ts",
     "app/lib/kerrScienceBandObservationServerV350.test.ts",
     "app/api/atlas/relativity-evidence/v350/observation/route.test.ts",
     "app/lib/atlasShadowCapabilityPointerV350.test.ts",
     "app/lib/relativityEvidenceServerV350.test.ts",
     "app/api/atlas/relativity-evidence/v350/route.test.ts",
     "app/components/KerrScienceBandObservationSurfaceV350.test.tsx",
     "app/lib/kerrObserverFrameUncertaintyV351.test.ts",
     "app/lib/kerrObserverFrameUncertaintyServerV351.test.ts",
     "app/api/atlas/relativity-evidence/v351/ledger/route.test.ts",
     "app/components/KerrObserverFrameUncertaintySurfaceV351.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV351.test.ts",
     "app/lib/relativityEvidenceServerV351.test.ts",
     "app/api/atlas/relativity-evidence/v351/route.test.ts",
     "app/lib/kerrPhotonResponseUncertaintyV352.test.ts",
     "app/lib/kerrPhotonResponseUncertaintyServerV352.test.ts",
     "app/api/atlas/relativity-evidence/v352/photon-response/route.test.ts",
     "app/components/KerrPhotonResponseUncertaintySurfaceV352.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV352.test.ts",
     "app/lib/relativityEvidenceServerV352.test.ts",
     "app/api/atlas/relativity-evidence/v352/route.test.ts",
     "app/lib/kerrSpectralShapeResponseV353.test.ts",
     "app/lib/kerrSpectralShapeResponseServerV353.test.ts",
     "app/api/atlas/relativity-evidence/v353/spectral-shape/route.test.ts",
     "app/components/KerrSpectralShapeResponseSurfaceV353.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV353.test.ts",
     "app/lib/kerrSpectralCorrelationResponseV354.test.ts",
     "app/lib/kerrSpectralCorrelationResponseServerV354.test.ts",
     "app/api/atlas/relativity-evidence/v354/spectral-correlation/route.test.ts",
     "app/components/KerrSpectralCorrelationSurfaceV354.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV354.test.ts",
     "app/lib/kerrSpectralEigenmodeAuditV355.test.ts",
     "app/lib/kerrSpectralEigenmodeAuditServerV355.test.ts",
     "app/api/atlas/relativity-evidence/v355/spectral-eigenmodes/route.test.ts",
     "app/components/KerrSpectralEigenmodeSurfaceV355.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV355.test.ts",
     "app/lib/kerrSpectralEnvelopeV356.test.ts",
     "app/lib/kerrSpectralEnvelopeServerV356.test.ts",
     "app/api/atlas/relativity-evidence/v356/spectral-envelope/route.test.ts",
     "app/components/KerrSpectralEnvelopeSurfaceV356.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV356.test.ts",
     "app/lib/kerrSpectralConfidenceScaleV357.test.ts",
     "app/lib/kerrSpectralConfidenceScaleServerV357.test.ts",
     "app/api/atlas/relativity-evidence/v357/confidence-scale/route.test.ts",
     "app/components/KerrSpectralConfidenceScaleSurfaceV357.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV357.test.ts",
     "app/lib/kerrObservablePhotonUncertaintyV358.test.ts",
     "app/lib/kerrObservablePhotonUncertaintyServerV358.test.ts",
     "app/api/atlas/relativity-evidence/v358/observable-photons/route.test.ts",
     "app/components/KerrObservablePhotonUncertaintySurfaceV358.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV358.test.ts",
     "app/lib/kerrPhotonCountingNoiseBudgetV359.test.ts",
     "app/lib/kerrPhotonCountingNoiseBudgetServerV359.test.ts",
     "app/api/atlas/relativity-evidence/v359/counting-noise/route.test.ts",
     "app/components/KerrPhotonCountingNoiseSurfaceV359.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV359.test.ts",
     "app/lib/kerrDetectorBreakEvenV360.test.ts",
     "app/lib/kerrDetectorBreakEvenServerV360.test.ts",
     "app/api/atlas/relativity-evidence/v360/detector-break-even/route.test.ts",
     "app/components/KerrDetectorBreakEvenSurfaceV360.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV360.test.ts",
     "app/lib/detectorCalibrationAdmissionV361.test.ts",
     "app/lib/detectorCalibrationAdmissionServerV361.test.ts",
     "app/api/atlas/relativity-evidence/v361/detector-calibration/route.test.ts",
     "app/components/DetectorCalibrationAdmissionSurfaceV361.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV361.test.ts",
     "app/lib/atlasObservationEvidenceCacheV401.test.ts",
     "app/lib/atlasObservationEvidenceCacheQualificationV401.test.ts",
     "app/lib/atlasShadowCapabilityPointerV401.test.ts",
     "app/components/KerrObservationHubV400.test.tsx",
     "app/components/KerrConstraintForgeV396.test.tsx",
     "app/components/KerrObservationAirlockV397.test.tsx",
     "app/components/KerrObservationDockV398.test.tsx",
     "app/components/KerrProvenanceRailV399.test.tsx",
     "app/lib/atlasObservationEvidenceLifecycleV402.test.ts",
     "app/lib/atlasObservationEvidenceLifecycleQualificationV402.test.ts",
     "app/lib/atlasShadowCapabilityPointerV402.test.ts",
     "app/lib/atlasObservationEvidenceLifecycleReplayV403.test.ts",
     "app/lib/atlasShadowCapabilityPointerV403.test.ts",
     "app/components/KerrLifecycleAuditRailV403.test.tsx",
     "app/lib/atlasObservationLifecycleReplaySummaryV404.test.ts",
     "app/lib/relativityLifecycleEvidenceServerV404.test.ts",
     "app/lib/relativityLifecycleEvidenceClientV404.test.ts",
     "app/api/atlas/relativity-evidence/v404/lifecycle-summary/route.test.ts",
     "app/components/KerrLifecycleReplaySummaryV404.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV404.test.ts",
     "app/lib/atlasLifecycleProvenanceDossierV405.test.ts",
     "app/lib/atlasLifecycleProvenanceDossierServerV405.test.ts",
     "app/lib/atlasLifecycleProvenanceDossierClientV405.test.ts",
     "app/api/atlas/relativity-evidence/v405/lifecycle-dossier/route.test.ts",
     "app/lib/atlasVisualProfileV405.test.ts",
     "app/components/KerrEvidenceObservatoryV405.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV405.test.ts",
     "app/lib/kerrStokesTransferV406.test.ts",
     "app/lib/kerrStokesTransferServerV406.test.ts",
     "app/lib/kerrStokesTransferClientV406.test.ts",
     "app/api/atlas/relativity-evidence/v406/stokes-transfer/route.test.ts",
     "app/components/KerrStokesTransferSurfaceV406.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV406.test.ts",
     "app/lib/kerrScatteringAtmosphereV407.test.ts",
     "app/lib/kerrScatteringAtmosphereServerV407.test.ts",
     "app/lib/kerrScatteringAtmosphereClientV407.test.ts",
     "app/api/atlas/relativity-evidence/v407/scattering-atmosphere/route.test.ts",
     "app/components/KerrScatteringAtmosphereSurfaceV407.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV407.test.ts",
     "app/lib/kerrScatteringOracleV408.test.ts",
     "app/lib/kerrScatteringOracleServerV408.test.ts",
     "app/lib/kerrScatteringOracleClientV408.test.ts",
     "app/api/atlas/relativity-evidence/v408/scattering-oracle/route.test.ts",
     "app/components/KerrScatteringOracleSurfaceV408.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV408.test.ts",
     "app/lib/kerrScatteringCorrectedV409.test.ts",
     "app/lib/kerrScatteringCorrectedServerV409.test.ts",
     "app/lib/kerrScatteringCorrectedClientV409.test.ts",
     "app/api/atlas/relativity-evidence/v409/scattering-correction/route.test.ts",
     "app/components/KerrScatteringCorrectionSurfaceV409.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV409.test.ts",
     "app/lib/kerrIdealPolarimeterV410.test.ts",
     "app/lib/kerrIdealPolarimeterServerV410.test.ts",
     "app/lib/kerrIdealPolarimeterClientV410.test.ts",
     "app/api/atlas/relativity-evidence/v410/ideal-polarimeter/route.test.ts",
     "app/components/KerrIdealPolarimeterSurfaceV410.test.tsx",
     "app/lib/atlasShadowCapabilityPointerV410.test.ts",
     ...rest,
  ]);
  else if (action === "shadow-v297") run(process.execPath, ["scripts/verify-shadow-v297-light.mjs", ...rest]);
  else if (action === "shadow-v299") run(process.execPath, ["scripts/verify-shadow-v299-light.mjs", ...rest]);
  else if (action === "shadow-v312") run(process.execPath, ["scripts/verify-shadow-v312-light.mjs", ...rest]);
  else if (action === "shadow-v313") run(process.execPath, ["scripts/verify-shadow-v313-light.mjs", ...rest]);
  else if (action === "shadow-v315") run(process.execPath, ["scripts/verify-shadow-v315-light.mjs", ...rest]);
  else if (action === "shadow-v316") run(process.execPath, ["scripts/verify-shadow-v316-light.mjs", ...rest]);
  else if (action === "shadow-v317") run(process.execPath, ["scripts/verify-shadow-v317-light.mjs", ...rest]);
  else if (action === "shadow-v318") run(process.execPath, ["scripts/verify-shadow-v318-light.mjs", ...rest]);
  else if (action === "shadow-v319") run(process.execPath, ["scripts/verify-shadow-v319-light.mjs", ...rest]);
  else if (action === "shadow-v320") run(process.execPath, ["scripts/verify-shadow-v320-light.mjs", ...rest]);
  else if (action === "shadow-v321") run(process.execPath, ["scripts/verify-shadow-v321-light.mjs", ...rest]);
  else if (action === "shadow-v322") run(process.execPath, ["scripts/verify-shadow-v322-light.mjs", ...rest]);
  else if (action === "shadow-v323") run(process.execPath, ["scripts/verify-shadow-v323-light.mjs", ...rest]);
  else if (action === "shadow-v324") run(process.execPath, ["scripts/verify-shadow-v324-light.mjs", ...rest]);
  else if (action === "shadow-v325") run(process.execPath, ["scripts/verify-shadow-v325-light.mjs", ...rest]);
  else if (action === "shadow-v326") run(process.execPath, ["scripts/verify-shadow-v326-light.mjs", ...rest]);
  else if (action === "shadow-v327") run(process.execPath, ["scripts/verify-shadow-v327-light.mjs", ...rest]);
  else if (action === "shadow-v328") run(process.execPath, ["scripts/verify-shadow-v328-light.mjs", ...rest]);
  else if (action === "shadow-v329") run(process.execPath, ["scripts/verify-shadow-v329-light.mjs", ...rest]);
  else if (action === "shadow-v330") run(process.execPath, ["scripts/verify-shadow-v330-light.mjs", ...rest]);
  else if (action === "shadow-v331") run(process.execPath, ["scripts/verify-shadow-v331-light.mjs", ...rest]);
  else if (action === "shadow-v332") run(process.execPath, ["scripts/verify-shadow-v332-light.mjs", ...rest]);
  else if (action === "shadow-v333") run(process.execPath, ["scripts/verify-shadow-v333-light.mjs", ...rest]);
  else if (action === "shadow-v334") run(process.execPath, ["scripts/verify-shadow-v334-light.mjs", ...rest]);
  else if (action === "shadow-v335") run(process.execPath, ["scripts/verify-shadow-v335-light.mjs", ...rest]);
  else if (action === "shadow-v336") run(process.execPath, ["scripts/verify-shadow-v336-light.mjs", ...rest]);
  else if (action === "shadow-v337") run(process.execPath, ["scripts/verify-shadow-v337-light.mjs", ...rest]);
  else if (action === "shadow-v338") run(process.execPath, ["scripts/verify-shadow-v338-light.mjs", ...rest]);
  else if (action === "shadow-v339") run(process.execPath, ["scripts/verify-shadow-v339-light.mjs", ...rest]);
  else if (action === "shadow-v340") run(process.execPath, ["scripts/verify-shadow-v340-light.mjs", ...rest]);
  else if (action === "shadow-v341") run(process.execPath, ["scripts/verify-shadow-v341-light.mjs", ...rest]);
  else if (action === "shadow-v342") run(process.execPath, ["scripts/verify-shadow-v342-light.mjs", ...rest]);
  else if (action === "shadow-v343") run(process.execPath, ["scripts/verify-shadow-v343-light.mjs", ...rest]);
  else if (action === "shadow-v344") run(process.execPath, ["scripts/verify-shadow-v344-light.mjs", ...rest]);
  else if (action === "shadow-v345") run(process.execPath, ["scripts/verify-shadow-v345-light.mjs", ...rest]);
  else if (action === "shadow-v346") run(process.execPath, ["scripts/verify-shadow-v346-light.mjs", ...rest]);
  else if (action === "shadow-v347") run(process.execPath, ["scripts/verify-shadow-v347-light.mjs", ...rest]);
  else if (action === "shadow-v348") run(process.execPath, ["scripts/verify-shadow-v348-light.mjs", ...rest]);
  else if (action === "shadow-v349") run(process.execPath, ["scripts/verify-shadow-v349-light.mjs", ...rest]);
  else if (action === "shadow-v350") run(process.execPath, ["scripts/verify-shadow-v350-light.mjs", ...rest]);
  else if (action === "shadow-v351") run(process.execPath, ["scripts/verify-shadow-v351-light.mjs", ...rest]);
  else if (action === "shadow-v352") run(process.execPath, ["scripts/verify-shadow-v352-light.mjs", ...rest]);
  else if (action === "shadow-v353") run(process.execPath, ["scripts/verify-shadow-v353-light.mjs", ...rest]);
  else if (action === "shadow-v354") run(process.execPath, ["scripts/verify-shadow-v354-light.mjs", ...rest]);
  else if (action === "shadow-v355") run(process.execPath, ["scripts/verify-shadow-v355-light.mjs", ...rest]);
  else if (action === "shadow-v356") run(process.execPath, ["scripts/verify-shadow-v356-light.mjs", ...rest]);
  else if (action === "shadow-v357") run(process.execPath, ["scripts/verify-shadow-v357-light.mjs", ...rest]);
  else if (action === "shadow-v358") run(process.execPath, ["scripts/verify-shadow-v358-light.mjs", ...rest]);
  else if (action === "shadow-v359") run(process.execPath, ["scripts/verify-shadow-v359-light.mjs", ...rest]);
  else if (action === "shadow-v360") run(process.execPath, ["scripts/verify-shadow-v360-light.mjs", ...rest]);
  else if (action === "shadow-v361") run(process.execPath, ["scripts/verify-shadow-v361-light.mjs", ...rest]);
  else if (action === "shadow-v362") run(process.execPath, ["scripts/verify-shadow-v362-light.mjs", ...rest]);
  else if (action === "shadow-v363") run(process.execPath, ["scripts/verify-shadow-v363-light.mjs", ...rest]);
  else if (action === "shadow-v364") run(process.execPath, ["scripts/verify-shadow-v364-light.mjs", ...rest]);
  else if (action === "shadow-v365") run(process.execPath, ["scripts/verify-shadow-v365-light.mjs", ...rest]);
  else if (action === "shadow-v366") run(process.execPath, ["scripts/verify-shadow-v366-light.mjs", ...rest]);
  else if (action === "shadow-v367") run(process.execPath, ["scripts/verify-shadow-v367-light.mjs", ...rest]);
  else if (action === "shadow-v368") run(process.execPath, ["scripts/verify-shadow-v368-light.mjs", ...rest]);
  else if (action === "shadow-v369") run(process.execPath, ["scripts/verify-shadow-v369-light.mjs", ...rest]);
  else if (action === "shadow-v370") run(process.execPath, ["scripts/verify-shadow-v370-light.mjs", ...rest]);
  else if (action === "shadow-v371") run(process.execPath, ["scripts/verify-shadow-v371-light.mjs", ...rest]);
  else if (action === "shadow-v372") run(process.execPath, ["scripts/verify-shadow-v372-light.mjs", ...rest]);
  else if (action === "shadow-v373") run(process.execPath, ["scripts/verify-shadow-v373-light.mjs", ...rest]);
  else if (action === "shadow-v374") run(process.execPath, ["scripts/verify-shadow-v374-light.mjs", ...rest]);
  else if (action === "shadow-v375") run(process.execPath, ["scripts/verify-shadow-v375-light.mjs", ...rest]);
  else if (action === "shadow-v376") run(process.execPath, ["scripts/verify-shadow-v376-light.mjs", ...rest]);
  else if (action === "shadow-v377") run(process.execPath, ["scripts/verify-shadow-v377-light.mjs", ...rest]);
  else if (action === "shadow-v378") run(process.execPath, ["scripts/verify-shadow-v378-light.mjs", ...rest]);
  else if (action === "shadow-v379") run(process.execPath, ["scripts/verify-shadow-v379-light.mjs", ...rest]);
  else if (action === "shadow-v380") run(process.execPath, ["scripts/verify-shadow-v380-light.mjs", ...rest]);
  else if (action === "shadow-v381") run(process.execPath, ["scripts/verify-shadow-v381-light.mjs", ...rest]);
  else if (action === "shadow-v382r1") run(process.execPath, ["scripts/verify-shadow-v382r1-light.mjs", ...rest]);
  else if (action === "shadow-v383") run(process.execPath, ["scripts/verify-shadow-v383-light.mjs", ...rest]);
  else if (action === "shadow-v384") run(process.execPath, ["scripts/verify-shadow-v384-light.mjs", ...rest]);
  else if (action === "shadow-v385") run(process.execPath, ["scripts/verify-shadow-v385-light.mjs", ...rest]);
  else if (action === "shadow-v386") run(process.execPath, ["scripts/verify-shadow-v386-light.mjs", ...rest]);
  else if (action === "shadow-v387") run(process.execPath, ["scripts/verify-shadow-v387-light.mjs", ...rest]);
  else if (action === "shadow-v388") run(process.execPath, ["scripts/verify-shadow-v388-light.mjs", ...rest]);
  else if (action === "shadow-v389") run(process.execPath, ["scripts/verify-shadow-v389-light.mjs", ...rest]);
  else if (action === "shadow-v390") run(process.execPath, ["scripts/verify-shadow-v390-light.mjs", ...rest]);
  else if (action === "shadow-v391") run(process.execPath, ["scripts/verify-shadow-v391-light.mjs", ...rest]);
  else if (action === "shadow-v392") run(process.execPath, ["scripts/verify-shadow-v392-light.mjs", ...rest]);
  else if (action === "shadow-v393") run(process.execPath, ["scripts/verify-shadow-v393-light.mjs", ...rest]);
  else if (action === "shadow-v394") run(process.execPath, ["scripts/verify-shadow-v394-light.mjs", ...rest]);
  else if (action === "shadow-v395") run(process.execPath, ["scripts/verify-shadow-v395-light.mjs", ...rest]);
  else if (action === "shadow-v396") run(process.execPath, ["scripts/verify-shadow-v396-light.mjs", ...rest]);
  else if (action === "shadow-v397") run(process.execPath, ["scripts/verify-shadow-v397-light.mjs", ...rest]);
  else if (action === "shadow-v398") run(process.execPath, ["scripts/verify-shadow-v398-light.mjs", ...rest]);
  else if (action === "shadow-v399") run(process.execPath, ["scripts/verify-shadow-v399-light.mjs", ...rest]);
  else if (action === "shadow-v400") run(process.execPath, ["scripts/verify-shadow-v400-light.mjs", ...rest]);
  else if (action === "shadow-v401") run(process.execPath, ["scripts/verify-shadow-v401-light.mjs", ...rest]);
  else if (action === "shadow-v402") run(process.execPath, ["scripts/verify-shadow-v402-light.mjs", ...rest]);
  else if (action === "shadow-v403") run(process.execPath, ["scripts/verify-shadow-v403-light.mjs", ...rest]);
  else if (action === "shadow-v404") run(process.execPath, ["scripts/verify-shadow-v404-light.mjs", ...rest]);
  else if (action === "shadow-v405") run(process.execPath, ["scripts/verify-shadow-v405-light.mjs", ...rest]);
  else if (action === "shadow-v406") run(process.execPath, ["scripts/verify-shadow-v406-light.mjs", ...rest]);
  else if (action === "shadow-v407") run(process.execPath, ["scripts/verify-shadow-v407-light.mjs", ...rest]);
  else if (action === "shadow-v408") run(process.execPath, ["scripts/verify-shadow-v408-light.mjs", ...rest]);
  else if (action === "shadow-v409") run(process.execPath, ["scripts/verify-shadow-v409-light.mjs", ...rest]);
  else if (action === "shadow-v410") run(process.execPath, ["scripts/verify-shadow-v410-light.mjs", ...rest]);
  else if (action === "shadow-v411") run(process.execPath, ["scripts/verify-shadow-v411-light.mjs", ...rest]);
  else if (action === "shadow-v412") run(process.execPath, ["scripts/verify-shadow-v412-light.mjs", ...rest]);
  else if (action === "shadow-v413") run(process.execPath, ["scripts/verify-shadow-v413-light.mjs", ...rest]);
  else if (action === "shadow-v414") run(process.execPath, ["scripts/verify-shadow-v414-light.mjs", ...rest]);
  else if (action === "shadow-v415") run(process.execPath, ["scripts/verify-shadow-v415-light.mjs", ...rest]);
  else if (action === "shadow-v416") run(process.execPath, ["scripts/verify-shadow-v416-light.mjs", ...rest]);
  else if (action === "shadow-v417") run(process.execPath, ["scripts/verify-shadow-v417-light.mjs", ...rest]);
  else if (action === "shadow-v418") run(process.execPath, ["scripts/verify-shadow-v418-light.mjs", ...rest]);
  else if (action === "shadow-v419") run(process.execPath, ["scripts/verify-shadow-v419-light.mjs", ...rest]);
  else if (action === "shadow-v420") run(process.execPath, ["scripts/verify-shadow-v420-light.mjs", ...rest]);
  else if (action === "shadow-v421") run(process.execPath, ["scripts/verify-shadow-v421-light.mjs", ...rest]);
  else if (action === "shadow-v422") run(process.execPath, ["scripts/verify-shadow-v422-light.mjs", ...rest]);
  else if (action === "shadow-v423") run(process.execPath, ["scripts/verify-shadow-v423-light.mjs", ...rest]);
  else if (action === "shadow-v424") run(process.execPath, ["scripts/verify-shadow-v424-light.mjs", ...rest]);
  else if (action === "shadow-v425") run(process.execPath, ["scripts/verify-shadow-v425-light.mjs", ...rest]);
  else if (action === "shadow-v426") run(process.execPath, ["scripts/verify-shadow-v426-light.mjs", ...rest]);
  else if (action === "shadow-v427") run(process.execPath, ["scripts/verify-shadow-v427-light.mjs", ...rest]);
  else if (action === "shadow-v428") run(process.execPath, ["scripts/verify-shadow-v428-light.mjs", ...rest]);
  else if (action === "shadow-v429") run(process.execPath, ["scripts/verify-shadow-v429-light.mjs", ...rest]);
  else if (action === "shadow-v430") run(process.execPath, ["scripts/verify-shadow-v430-light.mjs", ...rest]);
  else if (action === "shadow-v431") run(process.execPath, ["scripts/verify-shadow-v431-light.mjs", ...rest]);
  else if (action === "shadow-v432") run(process.execPath, ["scripts/verify-shadow-v432-light.mjs", ...rest]);
  else if (action === "shadow-v433") run(process.execPath, ["scripts/verify-shadow-v433-light.mjs", ...rest]);
  else if (action === "shadow-v434") run(process.execPath, ["scripts/verify-shadow-v434-light.mjs", ...rest]);
  else if (action === "shadow-v435") run(process.execPath, ["scripts/verify-shadow-v435-light.mjs", ...rest]);
  else if (action === "shadow-v436") run(process.execPath, ["scripts/verify-shadow-v436-light.mjs", ...rest]);
  else if (action === "shadow-v437") run(process.execPath, ["scripts/verify-shadow-v437-light.mjs", ...rest]);
  else if (action === "shadow-v438") run(process.execPath, ["scripts/verify-shadow-v438-light.mjs", ...rest]);
  else if (action === "shadow-v439") run(process.execPath, ["scripts/verify-shadow-v439-light.mjs", ...rest]);
  else if (action === "shadow-v440") run(process.execPath, ["scripts/verify-shadow-v440-light.mjs", ...rest]);
  else if (action === "shadow-v441") run(process.execPath, ["scripts/verify-shadow-v441-light.mjs", ...rest]);
  else if (action === "shadow-v485") run(process.execPath, ["scripts/verify-shadow-v485-light.mjs", ...rest]);
  else if (action === "shadow-v486") run(process.execPath, ["scripts/verify-shadow-v486-light.mjs", ...rest]);
  else if (action === "shadow-v520") run(process.execPath, ["scripts/verify-shadow-v520-light.mjs", ...rest]);
  else if (action === "shadow-v521") run(process.execPath, ["scripts/verify-shadow-v521-light.mjs", ...rest]);
  else if (action === "shadow-v522") run(process.execPath, ["scripts/verify-shadow-v522-light.mjs", ...rest]);
  else if (action === "shadow-v523") run(process.execPath, ["scripts/verify-shadow-v523-light.mjs", ...rest]);
  else if (action === "shadow-v524") run(process.execPath, ["scripts/verify-shadow-v524-light.mjs", ...rest]);
  else if (action === "shadow-v525") run(process.execPath, ["scripts/verify-shadow-v525-light.mjs", ...rest]);
  else if (action === "shadow-v526") run(process.execPath, ["scripts/verify-shadow-v526-light.mjs", ...rest]);
  else if (action === "shadow-v527") run(process.execPath, ["scripts/verify-shadow-v527-light.mjs", ...rest]);
  else if (action === "shadow-v528") run(process.execPath, ["scripts/verify-shadow-v528-light.mjs", ...rest]);
  else if (action === "shadow-v529") run(process.execPath, ["scripts/verify-shadow-v529-light.mjs", ...rest]);
  else if (action === "shadow-v530") run(process.execPath, ["scripts/verify-shadow-v530-light.mjs", ...rest]);
  else if (action === "shadow-v531") run(process.execPath, ["scripts/verify-shadow-v531-light.mjs", ...rest]);
  else if (action === "shadow-v532") run(process.execPath, ["scripts/verify-shadow-v532-light.mjs", ...rest]);
  else if (action === "shadow-v533") run(process.execPath, ["scripts/verify-shadow-v533-light.mjs", ...rest]);
  else if (action === "shadow-v534") run(process.execPath, ["scripts/verify-shadow-v534-light.mjs", ...rest]);
  else if (action === "shadow-v535") run(process.execPath, ["scripts/verify-shadow-v535-light.mjs", ...rest]);
  else if (action === "shadow-v536") run(process.execPath, ["scripts/verify-shadow-v536-light.mjs", ...rest]);
  else if (action === "shadow-v537") run(process.execPath, ["scripts/verify-shadow-v537-light.mjs", ...rest]);
  else if (action === "shadow-v538") run(process.execPath, ["scripts/verify-shadow-v538-light.mjs", ...rest]);
  else if (action === "shadow-v539") run(process.execPath, ["scripts/verify-shadow-v539-light.mjs", ...rest]);
  else if (action === "shadow-v540") run(process.execPath, ["scripts/verify-shadow-v540-light.mjs", ...rest]);
  else if (action === "shadow-v541") run(process.execPath, ["scripts/verify-shadow-v541-light.mjs", ...rest]);
  else if (action === "shadow-v542") run(process.execPath, ["scripts/verify-shadow-v542-light.mjs", ...rest]);
  else if (action === "shadow-v543") run(process.execPath, ["scripts/verify-shadow-v543-light.mjs", ...rest]);
  else if (action === "shadow-v544") run(process.execPath, ["scripts/verify-shadow-v544-light.mjs", ...rest]);
  else if (action === "shadow-v545") run(process.execPath, ["scripts/verify-shadow-v545-light.mjs", ...rest]);
  else if (action === "shadow-v546") run(process.execPath, ["scripts/verify-shadow-v546-light.mjs", ...rest]);
  else if (action === "shadow-v547") run(process.execPath, ["scripts/verify-shadow-v547-light.mjs", ...rest]);
  else if (action === "shadow-v548") run(process.execPath, ["scripts/verify-shadow-v548-light.mjs", ...rest]);
  else if (action === "shadow-v549") run(process.execPath, ["scripts/verify-shadow-v549-light.mjs", ...rest]);
  else if (action === "shadow-v550") run(process.execPath, ["scripts/verify-shadow-v550-light.mjs", ...rest]);
  else if (action === "shadow-v551") run(process.execPath, ["scripts/verify-shadow-v551-light.mjs", ...rest]);
  else if (action === "shadow-v552") run(process.execPath, ["scripts/verify-shadow-v552-light.mjs", ...rest]);
  else if (action === "shadow-v553") run(process.execPath, ["scripts/verify-shadow-v553-light.mjs", ...rest]);
  else if (action === "shadow-v554") run(process.execPath, ["scripts/verify-shadow-v554-light.mjs", ...rest]);
  else if (action === "shadow-v555") run(process.execPath, ["scripts/verify-shadow-v555-light.mjs", ...rest]);
  else if (action === "shadow-v556") run(process.execPath, ["scripts/verify-shadow-v556-light.mjs", ...rest]);
  else if (action === "shadow-v557") run(process.execPath, ["scripts/verify-shadow-v557-light.mjs", ...rest]);
  else if (action === "shadow-v558") run(process.execPath, ["scripts/verify-shadow-v558-light.mjs", ...rest]);
  else if (action === "shadow-v559") run(process.execPath, ["scripts/verify-shadow-v559-light.mjs", ...rest]);
  else if (action === "shadow-v560") run(process.execPath, ["scripts/verify-shadow-v560-light.mjs", ...rest]);
  else throw new Error("test requires focused, v271-recovery, shadow-v270, shadow-v275, shadow-v285r1, shadow-v297, shadow-v299, shadow-v312 through shadow-v441, shadow-v485, shadow-v486, shadow-v520 through shadow-v560, types or full");
} else if (domain === "evidence") {
  if (action === "truth-v286") run(process.execPath, ["scripts/build-scientific-evidence-truth-audit-v286.mjs", ...rest]);
  else if (action === "kerr-v288-envelope") run(process.execPath, ["scripts/build-kerr-authority-envelope-v290.mjs", ...rest]);
  else if (action === "shadow-v290") run(process.execPath, ["scripts/build-shadow-candidate-v290.mjs", ...rest]);
  else if (action === "shadow-v295") run(process.execPath, ["scripts/build-shadow-candidate-v295.mjs", ...rest]);
  else if (action === "kerr-v296-envelope") run(process.execPath, ["scripts/build-kerr-authority-envelope-v296.mjs", ...rest]);
  else if (action === "kerr-v297-envelope") run(process.execPath, ["scripts/build-kerr-authority-envelope-v297.mjs", ...rest]);
  else if (action === "shadow-v296") run(process.execPath, ["scripts/build-shadow-candidate-v296.mjs", ...rest]);
  else if (action === "shadow-v297") run(process.execPath, ["scripts/build-shadow-candidate-v297.mjs", ...rest]);
  else if (action === "shadow-v299") run(process.execPath, ["scripts/build-shadow-candidate-v299.mjs", ...rest]);
  else if (action === "shadow-v312") run(process.execPath, ["scripts/build-shadow-candidate-v312.mjs", ...rest]);
  else if (action === "shadow-v313") run(process.execPath, ["scripts/build-shadow-candidate-v313.mjs", ...rest]);
  else if (action === "shadow-v314") run(process.execPath, ["scripts/build-shadow-candidate-v314.mjs", ...rest]);
  else if (action === "shadow-v315") run(process.execPath, ["scripts/build-shadow-candidate-v315.mjs", ...rest]);
  else if (action === "shadow-v316") run(process.execPath, ["scripts/build-shadow-candidate-v316.mjs", ...rest]);
  else if (action === "shadow-v317") run(process.execPath, ["scripts/build-shadow-candidate-v317.mjs", ...rest]);
  else if (action === "shadow-v318") run(process.execPath, ["scripts/build-shadow-candidate-v318.mjs", ...rest]);
  else if (action === "shadow-v319") run(process.execPath, ["scripts/build-shadow-candidate-v319.mjs", ...rest]);
  else if (action === "shadow-v320") run(process.execPath, ["scripts/build-shadow-candidate-v320.mjs", ...rest]);
  else if (action === "shadow-v321") run(process.execPath, ["scripts/build-shadow-candidate-v321.mjs", ...rest]);
  else if (action === "shadow-v322") run(process.execPath, ["scripts/build-shadow-candidate-v322.mjs", ...rest]);
  else if (action === "shadow-v323") run(process.execPath, ["scripts/build-shadow-candidate-v323.mjs", ...rest]);
  else if (action === "shadow-v324") run(process.execPath, ["scripts/build-shadow-candidate-v324.mjs", ...rest]);
  else if (action === "shadow-v325") run(process.execPath, ["scripts/build-shadow-candidate-v325.mjs", ...rest]);
  else if (action === "shadow-v326") run(process.execPath, ["scripts/build-shadow-candidate-v326.mjs", ...rest]);
  else if (action === "shadow-v327") run(process.execPath, ["scripts/build-shadow-candidate-v327.mjs", ...rest]);
  else if (action === "shadow-v328") run(process.execPath, ["scripts/build-shadow-candidate-v328.mjs", ...rest]);
  else if (action === "shadow-v329") run(process.execPath, ["scripts/build-shadow-candidate-v329.mjs", ...rest]);
  else if (action === "shadow-v330") run(process.execPath, ["scripts/build-shadow-candidate-v330.mjs", ...rest]);
  else if (action === "shadow-v331") run(process.execPath, ["scripts/build-shadow-candidate-v331.mjs", ...rest]);
  else if (action === "shadow-v332") run(process.execPath, ["scripts/build-shadow-candidate-v332.mjs", ...rest]);
  else if (action === "shadow-v333") run(process.execPath, ["scripts/build-shadow-candidate-v333.mjs", ...rest]);
  else if (action === "shadow-v334") run(process.execPath, ["scripts/build-shadow-candidate-v334.mjs", ...rest]);
  else if (action === "shadow-v335") run(process.execPath, ["scripts/build-shadow-candidate-v335.mjs", ...rest]);
  else if (action === "shadow-v336") run(process.execPath, ["scripts/build-shadow-candidate-v336.mjs", ...rest]);
  else if (action === "shadow-v337") run(process.execPath, ["scripts/build-shadow-candidate-v337.mjs", ...rest]);
  else if (action === "shadow-v338") run(process.execPath, ["scripts/build-shadow-candidate-v338.mjs", ...rest]);
  else if (action === "shadow-v339") run(process.execPath, ["scripts/build-shadow-candidate-v339.mjs", ...rest]);
  else if (action === "shadow-v340") run(process.execPath, ["scripts/build-shadow-candidate-v340.mjs", ...rest]);
  else if (action === "shadow-v341") run(process.execPath, ["scripts/build-shadow-candidate-v341.mjs", ...rest]);
  else if (action === "shadow-v342") run(process.execPath, ["scripts/build-shadow-candidate-v342.mjs", ...rest]);
  else if (action === "shadow-v343") run(process.execPath, ["scripts/build-shadow-candidate-v343.mjs", ...rest]);
  else if (action === "shadow-v344") run(process.execPath, ["scripts/build-shadow-candidate-v344.mjs", ...rest]);
  else if (action === "shadow-v345") run(process.execPath, ["scripts/build-shadow-candidate-v345.mjs", ...rest]);
  else if (action === "shadow-v346") run(process.execPath, ["scripts/build-shadow-candidate-v346.mjs", ...rest]);
  else if (action === "shadow-v347") run(process.execPath, ["scripts/build-shadow-candidate-v347.mjs", ...rest]);
  else if (action === "shadow-v348") run(process.execPath, ["scripts/build-shadow-candidate-v348.mjs", ...rest]);
  else if (action === "shadow-v349") run(process.execPath, ["scripts/build-shadow-candidate-v349.mjs", ...rest]);
  else if (action === "shadow-v350") run(process.execPath, ["scripts/build-shadow-candidate-v350.mjs", ...rest]);
  else if (action === "shadow-v351") run(process.execPath, ["scripts/build-shadow-candidate-v351.mjs", ...rest]);
  else if (action === "shadow-v352") run(process.execPath, ["scripts/build-shadow-candidate-v352.mjs", ...rest]);
  else if (action === "shadow-v353") run(process.execPath, ["scripts/build-shadow-candidate-v353.mjs", ...rest]);
  else if (action === "shadow-v354") run(process.execPath, ["scripts/build-shadow-candidate-v354.mjs", ...rest]);
  else if (action === "shadow-v355") run(process.execPath, ["scripts/build-shadow-candidate-v355.mjs", ...rest]);
  else if (action === "shadow-v356") run(process.execPath, ["scripts/build-shadow-candidate-v356.mjs", ...rest]);
  else if (action === "shadow-v357") run(process.execPath, ["scripts/build-shadow-candidate-v357.mjs", ...rest]);
  else if (action === "shadow-v358") run(process.execPath, ["scripts/build-shadow-candidate-v358.mjs", ...rest]);
  else if (action === "shadow-v359") run(process.execPath, ["scripts/build-shadow-candidate-v359.mjs", ...rest]);
  else if (action === "shadow-v360") run(process.execPath, ["scripts/build-shadow-candidate-v360.mjs", ...rest]);
  else if (action === "shadow-v361") run(process.execPath, ["scripts/build-shadow-candidate-v361.mjs", ...rest]);
  else if (action === "shadow-v362") run(process.execPath, ["scripts/build-shadow-candidate-v362.mjs", ...rest]);
  else if (action === "shadow-v363") run(process.execPath, ["scripts/build-shadow-candidate-v363.mjs", ...rest]);
  else if (action === "shadow-v364") run(process.execPath, ["scripts/build-shadow-candidate-v364.mjs", ...rest]);
  else if (action === "shadow-v365") run(process.execPath, ["scripts/build-shadow-candidate-v365.mjs", ...rest]);
  else if (action === "shadow-v366") run(process.execPath, ["scripts/build-shadow-candidate-v366.mjs", ...rest]);
  else if (action === "shadow-v367") run(process.execPath, ["scripts/build-shadow-candidate-v367.mjs", ...rest]);
  else if (action === "shadow-v368") run(process.execPath, ["scripts/build-shadow-candidate-v368.mjs", ...rest]);
  else if (action === "shadow-v369") run(process.execPath, ["scripts/build-shadow-candidate-v369.mjs", ...rest]);
  else if (action === "shadow-v370") run(process.execPath, ["scripts/build-shadow-candidate-v370.mjs", ...rest]);
  else if (action === "shadow-v371") run(process.execPath, ["scripts/build-shadow-candidate-v371.mjs", ...rest]);
  else if (action === "shadow-v372") run(process.execPath, ["scripts/build-shadow-candidate-v372.mjs", ...rest]);
  else if (action === "shadow-v373") run(process.execPath, ["scripts/build-shadow-candidate-v373.mjs", ...rest]);
  else if (action === "shadow-v374") run(process.execPath, ["scripts/build-shadow-candidate-v374.mjs", ...rest]);
  else if (action === "shadow-v375") run(process.execPath, ["scripts/build-shadow-candidate-v375.mjs", ...rest]);
  else if (action === "shadow-v376") run(process.execPath, ["scripts/build-shadow-candidate-v376.mjs", ...rest]);
  else if (action === "shadow-v377") run(process.execPath, ["scripts/build-shadow-candidate-v377.mjs", ...rest]);
  else if (action === "shadow-v378") run(process.execPath, ["scripts/build-shadow-candidate-v378.mjs", ...rest]);
  else if (action === "shadow-v379") run(process.execPath, ["scripts/build-shadow-candidate-v379.mjs", ...rest]);
  else if (action === "shadow-v380") run(process.execPath, ["scripts/build-shadow-candidate-v380.mjs", ...rest]);
  else if (action === "shadow-v381") run(process.execPath, ["scripts/build-shadow-candidate-v381.mjs", ...rest]);
  else if (action === "shadow-v382r1") run(process.execPath, ["scripts/build-shadow-candidate-v382r1.mjs", ...rest]);
  else if (action === "shadow-v383") run(process.execPath, ["scripts/build-shadow-candidate-v383.mjs", ...rest]);
  else if (action === "shadow-v384") run(process.execPath, ["scripts/build-shadow-candidate-v384.mjs", ...rest]);
  else if (action === "shadow-v385") run(process.execPath, ["scripts/build-shadow-candidate-v385.mjs", ...rest]);
  else if (action === "shadow-v386") run(process.execPath, ["scripts/build-shadow-candidate-v386.mjs", ...rest]);
  else if (action === "shadow-v387") run(process.execPath, ["scripts/build-shadow-candidate-v387.mjs", ...rest]);
  else if (action === "shadow-v388") run(process.execPath, ["scripts/build-shadow-candidate-v388.mjs", ...rest]);
  else if (action === "shadow-v389") run(process.execPath, ["scripts/build-shadow-candidate-v389.mjs", ...rest]);
  else if (action === "shadow-v390") run(process.execPath, ["scripts/build-shadow-candidate-v390.mjs", ...rest]);
  else if (action === "shadow-v391") run(process.execPath, ["scripts/build-shadow-candidate-v391.mjs", ...rest]);
  else if (action === "shadow-v392") run(process.execPath, ["scripts/build-shadow-candidate-v392.mjs", ...rest]);
  else if (action === "shadow-v393") run(process.execPath, ["scripts/build-shadow-candidate-v393.mjs", ...rest]);
  else if (action === "shadow-v394") run(process.execPath, ["scripts/build-shadow-candidate-v394.mjs", ...rest]);
  else if (action === "shadow-v395") run(process.execPath, ["scripts/build-shadow-candidate-v395.mjs", ...rest]);
  else if (action === "shadow-v396") run(process.execPath, ["scripts/build-shadow-candidate-v396.mjs", ...rest]);
  else if (action === "shadow-v397") run(process.execPath, ["scripts/build-shadow-candidate-v397.mjs", ...rest]);
  else if (action === "shadow-v398") run(process.execPath, ["scripts/build-shadow-candidate-v398.mjs", ...rest]);
  else if (action === "shadow-v399") run(process.execPath, ["scripts/build-shadow-candidate-v399.mjs", ...rest]);
  else if (action === "shadow-v400") run(process.execPath, ["scripts/build-shadow-candidate-v400.mjs", ...rest]);
  else if (action === "shadow-v401") run(process.execPath, ["scripts/build-shadow-candidate-v401.mjs", ...rest]);
  else if (action === "shadow-v402") run(process.execPath, ["scripts/build-shadow-candidate-v402.mjs", ...rest]);
  else if (action === "shadow-v403") run(process.execPath, ["scripts/build-shadow-candidate-v403.mjs", ...rest]);
  else if (action === "shadow-v404") run(process.execPath, ["scripts/build-shadow-candidate-v404.mjs", ...rest]);
  else if (action === "shadow-v405") run(process.execPath, ["scripts/build-shadow-candidate-v405.mjs", ...rest]);
  else if (action === "shadow-v406") run(process.execPath, ["scripts/build-shadow-candidate-v406.mjs", ...rest]);
  else if (action === "shadow-v407") run(process.execPath, ["scripts/build-shadow-candidate-v407.mjs", ...rest]);
  else if (action === "shadow-v408") run(process.execPath, ["scripts/build-shadow-candidate-v408.mjs", ...rest]);
  else if (action === "shadow-v409") run(process.execPath, ["scripts/build-shadow-candidate-v409.mjs", ...rest]);
  else if (action === "shadow-v410") run(process.execPath, ["scripts/build-shadow-candidate-v410.mjs", ...rest]);
  else if (action === "shadow-v411") run(process.execPath, ["scripts/build-shadow-candidate-v411.mjs", ...rest]);
  else if (action === "shadow-v412") run(process.execPath, ["scripts/build-shadow-candidate-v412.mjs", ...rest]);
  else if (action === "shadow-v413") run(process.execPath, ["scripts/build-shadow-candidate-v413.mjs", ...rest]);
  else if (action === "shadow-v414") run(process.execPath, ["scripts/build-shadow-candidate-v414.mjs", ...rest]);
  else if (action === "shadow-v415") run(process.execPath, ["scripts/build-shadow-candidate-v415.mjs", ...rest]);
  else if (action === "shadow-v416") run(process.execPath, ["scripts/build-shadow-candidate-v416.mjs", ...rest]);
  else if (action === "shadow-v417") run(process.execPath, ["scripts/build-shadow-candidate-v417.mjs", ...rest]);
  else if (action === "shadow-v418") run(process.execPath, ["scripts/build-shadow-candidate-v418.mjs", ...rest]);
  else if (action === "shadow-v419") run(process.execPath, ["scripts/build-shadow-candidate-v419.mjs", ...rest]);
  else if (action === "shadow-v420") run(process.execPath, ["scripts/build-shadow-candidate-v420.mjs", ...rest]);
  else if (action === "shadow-v421") run(process.execPath, ["scripts/build-shadow-candidate-v421.mjs", ...rest]);
  else if (action === "shadow-v422") run(process.execPath, ["scripts/build-shadow-candidate-v422.mjs", ...rest]);
  else if (action === "shadow-v423") run(process.execPath, ["scripts/build-shadow-candidate-v423.mjs", ...rest]);
  else if (action === "shadow-v424") run(process.execPath, ["scripts/build-shadow-candidate-v424.mjs", ...rest]);
  else if (action === "shadow-v425") run(process.execPath, ["scripts/build-shadow-candidate-v425.mjs", ...rest]);
  else if (action === "shadow-v426") run(process.execPath, ["scripts/build-shadow-candidate-v426.mjs", ...rest]);
  else if (action === "shadow-v427") run(process.execPath, ["scripts/build-shadow-candidate-v427.mjs", ...rest]);
  else if (action === "shadow-v428") run(process.execPath, ["scripts/build-shadow-candidate-v428.mjs", ...rest]);
  else if (action === "shadow-v429") run(process.execPath, ["scripts/build-shadow-candidate-v429.mjs", ...rest]);
  else if (action === "shadow-v430") run(process.execPath, ["scripts/build-shadow-candidate-v430.mjs", ...rest]);
  else if (action === "shadow-v431") run(process.execPath, ["scripts/build-shadow-candidate-v431.mjs", ...rest]);
  else if (action === "shadow-v432") run(process.execPath, ["scripts/build-shadow-candidate-v432.mjs", ...rest]);
  else if (action === "shadow-v433") run(process.execPath, ["scripts/build-shadow-candidate-v433.mjs", ...rest]);
  else if (action === "shadow-v434") run(process.execPath, ["scripts/build-shadow-candidate-v434.mjs", ...rest]);
  else if (action === "shadow-v435") run(process.execPath, ["scripts/build-shadow-candidate-v435.mjs", ...rest]);
  else if (action === "shadow-v436") run(process.execPath, ["scripts/build-shadow-candidate-v436.mjs", ...rest]);
  else if (action === "shadow-v437") run(process.execPath, ["scripts/build-shadow-candidate-v437.mjs", ...rest]);
  else if (action === "shadow-v438") run(process.execPath, ["scripts/build-shadow-candidate-v438.mjs", ...rest]);
  else if (action === "shadow-v439") run(process.execPath, ["scripts/build-shadow-candidate-v439.mjs", ...rest]);
  else if (action === "shadow-v440") run(process.execPath, ["scripts/build-shadow-candidate-v440.mjs", ...rest]);
  else if (action === "shadow-v441") run(process.execPath, ["scripts/build-shadow-candidate-v441.mjs", ...rest]);
  else if (action === "shadow-v485") run(process.execPath, ["scripts/build-shadow-candidate-v485.mjs", ...rest]);
  else if (action === "shadow-v486") run(process.execPath, ["scripts/build-shadow-v486.mjs", ...rest]);
  else if (action === "shadow-v520") run(process.execPath, ["scripts/build-shadow-v520.mjs", ...rest]);
  else if (action === "shadow-v521") run(process.execPath, ["scripts/build-shadow-v521.mjs", ...rest]);
  else if (action === "shadow-v522") run(process.execPath, ["scripts/build-shadow-v522.mjs", ...rest]);
  else if (action === "shadow-v523") run(process.execPath, ["scripts/build-shadow-v523.mjs", ...rest]);
  else if (action === "shadow-v524") run(process.execPath, ["scripts/build-shadow-v524.mjs", ...rest]);
  else if (action === "shadow-v525") run(process.execPath, ["scripts/build-shadow-v525.mjs", ...rest]);
  else if (action === "shadow-v526") run(process.execPath, ["scripts/build-shadow-v526.mjs", ...rest]);
  else if (action === "shadow-v527") run(process.execPath, ["scripts/build-shadow-v527.mjs", ...rest]);
  else if (action === "shadow-v528") run(process.execPath, ["scripts/build-shadow-v528.mjs", ...rest]);
  else if (action === "shadow-v529") run(process.execPath, ["scripts/build-shadow-v529.mjs", ...rest]);
  else if (action === "shadow-v530") run(process.execPath, ["scripts/build-shadow-v530.mjs", ...rest]);
  else if (action === "shadow-v531") run(process.execPath, ["scripts/build-shadow-v531.mjs", ...rest]);
  else if (action === "shadow-v532") run(process.execPath, ["scripts/build-shadow-v532.mjs", ...rest]);
  else if (action === "shadow-v533") run(process.execPath, ["scripts/build-shadow-v533.mjs", ...rest]);
  else if (action === "shadow-v534") run(process.execPath, ["scripts/build-shadow-v534.mjs", ...rest]);
  else if (action === "shadow-v535") run(process.execPath, ["scripts/build-shadow-v535.mjs", ...rest]);
  else if (action === "shadow-v536") run(process.execPath, ["scripts/build-shadow-v536.mjs", ...rest]);
  else if (action === "shadow-v537") run(process.execPath, ["scripts/build-shadow-v537.mjs", ...rest]);
  else if (action === "shadow-v538") run(process.execPath, ["scripts/build-shadow-v538.mjs", ...rest]);
  else if (action === "shadow-v539") run(process.execPath, ["scripts/build-shadow-v539.mjs", ...rest]);
  else if (action === "shadow-v540") run(process.execPath, ["scripts/build-shadow-v540.mjs", ...rest]);
  else if (action === "shadow-v541") run(process.execPath, ["scripts/build-shadow-v541.mjs", ...rest]);
  else if (action === "shadow-v542") run(process.execPath, ["scripts/build-shadow-v542.mjs", ...rest]);
  else if (action === "shadow-v543") run(process.execPath, ["scripts/build-shadow-v543.mjs", ...rest]);
  else if (action === "shadow-v544") run(process.execPath, ["scripts/build-shadow-v544.mjs", ...rest]);
  else if (action === "shadow-v545") run(process.execPath, ["scripts/build-shadow-v545.mjs", ...rest]);
  else if (action === "shadow-v546") run(process.execPath, ["scripts/build-shadow-v546.mjs", ...rest]);
  else if (action === "shadow-v547") run(process.execPath, ["scripts/build-shadow-v547.mjs", ...rest]);
  else if (action === "shadow-v548") run(process.execPath, ["scripts/build-shadow-v548.mjs", ...rest]);
  else if (action === "shadow-v549") run(process.execPath, ["scripts/build-shadow-v549.mjs", ...rest]);
  else if (action === "shadow-v550") run(process.execPath, ["scripts/build-shadow-v550.mjs", ...rest]);
  else if (action === "shadow-v551") run(process.execPath, ["scripts/build-shadow-v551.mjs", ...rest]);
  else if (action === "shadow-v552") run(process.execPath, ["scripts/build-shadow-v552.mjs", ...rest]);
  else if (action === "shadow-v553-focused-negative") run(process.execPath, ["scripts/build-shadow-v553-focused-negative.mjs", ...rest]);
  else if (action === "shadow-v553") run(process.execPath, ["scripts/build-shadow-v553.mjs", ...rest]);
  else if (action === "shadow-v554") run(process.execPath, ["scripts/build-shadow-candidate-v554.mjs", ...rest]);
  else if (action === "shadow-v555") run(process.execPath, ["scripts/build-shadow-v555.mjs", ...rest]);
  else if (action === "shadow-v556") run(process.execPath, ["scripts/build-shadow-v556.mjs", ...rest]);
  else if (action === "shadow-v557") run(process.execPath, ["scripts/build-shadow-v557.mjs", ...rest]);
  else if (action === "shadow-v558") run(process.execPath, ["scripts/build-shadow-v558.mjs", ...rest]);
  else if (action === "shadow-v559") run(process.execPath, ["scripts/build-shadow-v559.mjs", ...rest]);
  else if (action === "shadow-v560") run(process.execPath, ["scripts/build-shadow-v560.mjs", ...rest]);
  else if (action === "v262") run("node", ["scripts/build-atlas-evidence-v262.mjs", ...rest]);
  else if (action === "v263") run("node", ["scripts/build-atlas-evidence-v263.mjs", ...rest]);
  else if (action === "v271-attempt-negative") run("node", ["scripts/build-gaia-research-v271-attempt-negative-evidence.mjs", ...rest]);
  else if (action === "v271-closure") run("node", ["scripts/build-gaia-research-v271-closure-evidence.mjs", ...rest]);
  else if (action === "v272-low-memory-negative") run("node", ["scripts/build-gaia-presentation-v272-low-memory-negative-evidence.mjs", ...rest]);
  else if (action === "v266-negative") run("node", ["scripts/build-observation-planner-v266-negative-evidence.mjs", ...rest]);
  else if (["v267", "v268", "v269", "v270-shadow"].includes(action)) run("node", ["scripts/build-shadow-candidate-v270.mjs", ...rest]);
  else if (action === "v275-browser-diagnostic") run("node", ["scripts/build-shadow-browser-diagnostic-v275.mjs", ...rest]);
  else if (action === "v275-soak-diagnostic-negative") run("node", ["scripts/build-shadow-soak-diagnostic-negative-v275.mjs", ...rest]);
  else if (action === "v275-soak-corrected") run("node", ["scripts/build-shadow-soak-corrected-v275.mjs", ...rest]);
  else if (action === "v275-performance-diagnostic") run("node", ["scripts/build-shadow-performance-diagnostic-v275.mjs", ...rest]);
  else if (action === "v275-visual-diagnostic-negative") run("node", ["scripts/build-shadow-visual-diagnostic-negative-v275.mjs", ...rest]);
  else if (action === "v275-visual-mobile-corrected-negative") run("node", ["scripts/build-shadow-visual-mobile-corrected-negative-v275.mjs", ...rest]);
  else if (action === "v275-shadow") run("node", ["scripts/build-shadow-candidate-v275.mjs", ...rest]);
  else if (action === "v278-strong-gravity") run("node", ["scripts/build-strong-gravity-v278-evidence.mjs", ...rest]);
  else if (action === "v276-reference") run("node", ["scripts/build-relativity-reference-v276.mjs", ...rest]);
  else if (action === "shadow-v280") run("node", ["scripts/build-shadow-candidate-v280.mjs", ...rest]);
  else if (action === "shadow-v281") run("node", ["scripts/build-v281-focused-closure-evidence.mjs", ...rest]);
  else if (action === "shadow-v285") run("node", ["scripts/build-shadow-candidate-v285.mjs", ...rest]);
  else if (action === "shadow-v285r1") run("node", ["scripts/build-shadow-candidate-v285r1.mjs", ...rest]);
  else if (action === "v280-focused-negative") run("node", ["scripts/build-v280-focused-negative-evidence.mjs", ...rest]);
  else throw new Error("evidence requires a supported evidence action");
} else if (domain === "science-status") {
  const evidence = JSON.parse(readFileSync(resolve(projectRoot, "dist/release/orbit-atlas-current-evidence-v233.json"), "utf8"));
  console.log(JSON.stringify({
    status: "science-failed-shadow-retained",
    defaultKernel: "legacy-eih-1pn",
    denseKerr: evidence.denseKerr ?? null,
    v259GaiaAnalysis: "product-research-layer-only",
    automaticRetryApplied: false,
  }, null, 2));
} else if (domain === "local-release") {
  if (action === "standalone") runNpm("build:atlas:standalone:current", rest);
  else if (action === "lite") runNpm("build:atlas:lite:current", rest);
  else throw new Error("local-release requires standalone or lite");
} else if (domain === "legacy") {
  const legacy = loadAtlasLegacyCommandMapV256(projectRoot);
  if (!action || !Object.hasOwn(legacy, action)) throw new Error(`Unknown legacy command: ${action || "<missing>"}`);
  runLegacyCommand(legacy[action], rest, legacy);
} else {
  throw new Error(`Unknown atlas domain: ${domain}`);
}
