import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";

const NAMES_ZH = [
  "太阳",
  "水星",
  "金星",
  "地球",
  "火星",
  "木星",
  "土星",
  "天王星",
  "海王星",
  "冥王星",
];

const COLORS = [
  0xffaa44, 0xaaaaaa, 0xc9b896, 0x4488cc, 0xc86432, 0xd4a574, 0xd8c896,
  0x88ccff, 0x4466ff, 0xb0a090,
];

const TRAIL_LEN = 1600;
const SCALE = 10;
const DT_BASE_S = 3600;

const canvas = document.querySelector("#c");
const css2dMount = document.querySelector("#css2d-mount");
const statRel = document.querySelector("#stat-rel");
const statWs = document.querySelector("#stat-ws");
const obsImg = document.querySelector("#obs-img");
const dockTime = document.querySelector("#dock-time");
const dockDps = document.querySelector("#dock-dps");
const btnPlay = document.querySelector("#btn-play");
const rangeTs = document.querySelector("#range-timescale");
const btnZoomIn = document.querySelector("#btn-zoom-in");
const btnZoomOut = document.querySelector("#btn-zoom-out");
const btnReset = document.querySelector("#btn-reset-view");
const diagToggle = document.querySelector("#diag-toggle");
const diagPanel = document.querySelector("#diag-panel");

obsImg.addEventListener("error", () => {
  obsImg.src = "/observation_placeholder.svg";
});

diagToggle.addEventListener("click", () => {
  const open = diagPanel.hidden;
  diagPanel.hidden = !open;
  diagToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

function jdToUtcCalendar(jd) {
  const ms = (jd - 2440587.5) * 86400000;
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC*`;
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.05,
  8000,
);
camera.position.set(0, 70, 120);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClear = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const css2dRenderer = new CSS2DRenderer();
css2dRenderer.setSize(window.innerWidth, window.innerHeight);
css2dRenderer.domElement.style.position = "fixed";
css2dRenderer.domElement.style.inset = "0";
css2dRenderer.domElement.style.pointerEvents = "none";
css2dMount.appendChild(css2dRenderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.45,
  0.48,
  0.82,
);
composer.addPass(bloomPass);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;

function makeProceduralSky() {
  const geo = new THREE.SphereGeometry(4000, 64, 64);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vW;
      void main() {
        vW = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vW;
      uniform float uTime;
      float nse(vec3 p) {
        return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453);
      }
      void main() {
        vec3 d = normalize(vW);
        float lat = d.y;
        float gal = exp(-pow(lat * 2.2, 2.0)) * 0.55;
        float band = exp(-pow((d.x * 0.65 + d.z * 0.55) * 2.8, 2.0));
        vec3 base = vec3(0.015, 0.018, 0.04);
        vec3 mil = vec3(0.22, 0.2, 0.38) * band * 0.9;
        vec3 disk = vec3(0.12, 0.14, 0.28) * gal;
        float tw = nse(d * 400.0 + uTime * 0.02) * 0.08;
        vec3 col = base + mil + disk + tw;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  return new THREE.Mesh(geo, mat);
}

const skyMesh = makeProceduralSky();
scene.add(skyMesh);

new THREE.TextureLoader().load(
  "/textures/milkyway_equirect.jpg",
  (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const skyTexMat = new THREE.MeshBasicMaterial({
      map: tex,
      side: THREE.BackSide,
      depthWrite: false,
    });
    skyMesh.material.dispose();
    skyMesh.material = skyTexMat;
  },
  undefined,
  () => {},
);

const systemRoot = new THREE.Group();
scene.add(systemRoot);

scene.add(new THREE.AmbientLight(0x334466, 0.06));
const sunLight = new THREE.PointLight(0xffeedd, 140, 0, 2);
systemRoot.add(sunLight);

const sunRoot = new THREE.Group();
systemRoot.add(sunRoot);

const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(2.2, 56, 56),
  new THREE.MeshBasicMaterial({ color: COLORS[0] }),
);
sunRoot.add(sunMesh);

const sunRimMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uColor: { value: new THREE.Color(0xff7733) },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying float vF;
    void main() {
      vec3 n = normalize(normalMatrix * normal);
      vec3 mv = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
      vF = pow(1.0 - abs(dot(n, mv)), 2.2);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uTime;
    varying float vF;
    void main() {
      float p = vF * (0.85 + 0.15 * sin(uTime * 2.0));
      gl_FragColor = vec4(uColor * p, p * 0.55);
    }
  `,
});
sunRoot.add(new THREE.Mesh(new THREE.SphereGeometry(2.45, 48, 48), sunRimMat));

sunRoot.add(
  new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 40, 40),
    new THREE.MeshBasicMaterial({
      color: 0xff8844,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  ),
);

const jetCount = 520;
const jetPos = new Float32Array(jetCount * 3);
const jetVel = new Float32Array(jetCount);
for (let j = 0; j < jetCount; j++) {
  jetPos[j * 3] = 2.2 + Math.random() * 4.2;
  jetPos[j * 3 + 1] = (Math.random() - 0.5) * 0.85;
  jetPos[j * 3 + 2] = (Math.random() - 0.5) * 0.85;
  jetVel[j] = 0.35 + Math.random() * 1.1;
}
const jetGeom = new THREE.BufferGeometry();
jetGeom.setAttribute("position", new THREE.BufferAttribute(jetPos, 3));
sunRoot.add(
  new THREE.Points(
    jetGeom,
    new THREE.PointsMaterial({
      color: 0xffddaa,
      size: 0.16,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    }),
  ),
);

function attachLabel(mesh, text) {
  const el = document.createElement("div");
  el.className = "label-planet";
  el.textContent = text;
  const lbl = new CSS2DObject(el);
  lbl.position.set(0, 1.4, 0);
  mesh.add(lbl);
  return lbl;
}

attachLabel(sunMesh, NAMES_ZH[0]);

const trails = [];
const lineRes = new THREE.Vector2(window.innerWidth, window.innerHeight);

for (let i = 1; i < 10; i++) {
  const rad = i === 5 ? 1.25 : i < 4 ? 0.32 : 0.5;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(rad, 36, 36),
    new THREE.MeshStandardMaterial({
      color: COLORS[i],
      roughness: 0.55,
      metalness: 0.06,
      emissive: new THREE.Color(COLORS[i]).multiplyScalar(0.05),
    }),
  );
  systemRoot.add(mesh);
  attachLabel(mesh, NAMES_ZH[i]);

  const lineGeom = new LineGeometry();
  const lineMat = new LineMaterial({
    color: COLORS[i],
    linewidth: 1.8,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    resolution: lineRes,
  });
  const line = new Line2(lineGeom, lineMat);
  line.frustumCulled = false;
  systemRoot.add(line);

  trails.push({ mesh, line, lineGeom, lineMat, hist: [], bodyIndex: i });
}

let nAsteroids = 100_000;
const astGeom = new THREE.BufferGeometry();
const astPos = new Float32Array(nAsteroids * 3);
astGeom.setAttribute("position", new THREE.BufferAttribute(astPos, 3));
const asteroids = new THREE.Points(
  astGeom,
  new THREE.PointsMaterial({
    color: 0x8899aa,
    size: 0.042,
    transparent: true,
    opacity: 0.38,
    sizeAttenuation: true,
    depthWrite: false,
  }),
);
asteroids.frustumCulled = false;
systemRoot.add(asteroids);

const clock = new THREE.Clock();
let timeScale = 1.0;
let simPaused = false;

function syncDockDps() {
  const dps = timeScale * (DT_BASE_S / 86400);
  dockDps.textContent = `${dps.toFixed(2)} 天/秒`;
}

function updatePlayButton() {
  btnPlay.textContent = simPaused ? "▶" : "⏸";
  btnPlay.title = simPaused ? "继续" : "暂停";
}

rangeTs.addEventListener("input", () => {
  timeScale = parseFloat(rangeTs.value);
  syncDockDps();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ timeScale }));
  }
});

btnPlay.addEventListener("click", () => {
  simPaused = !simPaused;
  updatePlayButton();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ paused: simPaused }));
  }
});

function zoomCamera(factor) {
  camera.position.multiplyScalar(factor);
  controls.update();
}
btnZoomIn.addEventListener("click", () => zoomCamera(0.92));
btnZoomOut.addEventListener("click", () => zoomCamera(1.08));
btnReset.addEventListener("click", () => {
  controls.target.set(0, 0, 0);
  camera.position.set(0, 70, 120);
  controls.update();
});

syncDockDps();
updatePlayButton();

function wsUrl() {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/sim`;
}

let ws;
function connectWs() {
  statWs.textContent = "连接中…";
  ws = new WebSocket(wsUrl());
  ws.binaryType = "arraybuffer";
  ws.onopen = () => {
    statWs.textContent = "已连接";
    ws.send(JSON.stringify({ timeScale, paused: simPaused }));
  };
  ws.onclose = () => {
    statWs.textContent = "断开，5s 后重连";
    setTimeout(connectWs, 5000);
  };
  ws.onerror = () => {
    statWs.textContent = "错误";
  };
  ws.onmessage = (ev) => {
    if (!(ev.data instanceof ArrayBuffer)) return;
    parseFrame(ev.data);
  };
}

function parseFrame(buf) {
  const dv = new DataView(buf);
  let o = 0;
  const magic = String.fromCharCode(
    dv.getUint8(0),
    dv.getUint8(1),
    dv.getUint8(2),
    dv.getUint8(3),
  );
  o += 4;
  if (magic !== "SSIM") return;
  const ver = dv.getUint32(o, true);
  o += 4;
  const nb = dv.getUint32(o, true);
  o += 4;
  const np = dv.getUint32(o, true);
  o += 4;

  let epochJd;
  let simElapsed;
  let rel;

  if (ver === 2) {
    epochJd = dv.getFloat64(o, true);
    o += 8;
    simElapsed = dv.getFloat64(o, true);
    o += 8;
    rel = dv.getFloat64(o, true);
    o += 8;
  } else if (ver === 1) {
    simElapsed = dv.getFloat32(o, true);
    o += 4;
    rel = dv.getFloat32(o, true);
    o += 4;
    epochJd = 2451545.0;
  } else return;

  const bodyFlat = new Float32Array(buf, o, nb * 3);
  o += nb * 3 * 4;
  const partFlat = new Float32Array(buf, o, np * 3);

  dockTime.textContent = jdToUtcCalendar(epochJd, simElapsed);
  statRel.textContent = rel.toExponential(4);

  const sx = bodyFlat[0] * SCALE;
  const sy = bodyFlat[1] * SCALE;
  const sz = bodyFlat[2] * SCALE;
  sunRoot.position.set(sx, sy, sz);
  sunLight.position.set(sx, sy, sz);

  for (const t of trails) {
    const i = t.bodyIndex;
    const px = bodyFlat[i * 3] * SCALE;
    const py = bodyFlat[i * 3 + 1] * SCALE;
    const pz = bodyFlat[i * 3 + 2] * SCALE;
    t.mesh.position.set(px, py, pz);

    const h = t.hist;
    h.push(new THREE.Vector3(px, py, pz));
    if (h.length > TRAIL_LEN) h.shift();

    const n = h.length;
    if (n >= 2) {
      const arr = new Float32Array(n * 3);
      for (let k = 0; k < n; k++) {
        arr[k * 3] = h[k].x;
        arr[k * 3 + 1] = h[k].y;
        arr[k * 3 + 2] = h[k].z;
      }
      t.lineGeom.setPositions(arr);
      t.line.computeLineDistances();
    }
  }

  if (np * 3 !== asteroids.geometry.attributes.position.array.length) {
    const arr = new Float32Array(np * 3);
    asteroids.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(arr, 3),
    );
    nAsteroids = np;
  }
  const ap = asteroids.geometry.attributes.position.array;
  for (let p = 0; p < np; p++) {
    ap[p * 3] = partFlat[p * 3] * SCALE;
    ap[p * 3 + 1] = partFlat[p * 3 + 1] * SCALE;
    ap[p * 3 + 2] = partFlat[p * 3 + 2] * SCALE;
  }
  asteroids.geometry.attributes.position.needsUpdate = true;

  const tt = clock.getElapsedTime();
  for (let j = 0; j < jetCount; j++) {
    jetPos[j * 3] += jetVel[j] * 0.011;
    if (jetPos[j * 3] > 8.5) jetPos[j * 3] = 2.2 + Math.sin(tt + j) * 0.08;
    jetPos[j * 3 + 1] += Math.sin(tt * 2.1 + j * 0.09) * 0.0035;
    jetPos[j * 3 + 2] += Math.cos(tt * 1.8 + j * 0.08) * 0.0035;
  }
  jetGeom.attributes.position.needsUpdate = true;
}

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloomPass.setSize(w, h);
  css2dRenderer.setSize(w, h);
  lineRes.set(w, h);
  for (const t of trails) {
    t.lineMat.resolution.copy(lineRes);
  }
}
window.addEventListener("resize", onResize);

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  sunRimMat.uniforms.uTime.value = t;
  if (skyMesh.material.uniforms?.uTime) {
    skyMesh.material.uniforms.uTime.value = t;
  }
  controls.update();
  renderer.clear();
  composer.render();
  css2dRenderer.render(scene, camera);
}

connectWs();
animate();
