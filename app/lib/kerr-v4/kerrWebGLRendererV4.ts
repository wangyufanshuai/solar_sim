/**
 * Minimal framework-free WebGL2 driver for the Kerr v4 shader.
 * Used by the standalone demo page and by the GPU-vs-float64 validation harness.
 * (The R3F component in components/KerrRendererV4.tsx drives the same shader through three.js.)
 */
import { kerrFragmentShaderV4, kerrVertexShaderV4, metricToMat4, type KerrRenderSettingsV4, type KerrUniformValuesV4 } from "./kerrShaderV4";

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(`shader compile failed: ${gl.getShaderInfoLog(sh)}`);
  return sh;
}

export class KerrWebGLRendererV4 {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private loc = new Map<string, WebGLUniformLocation | null>();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, kerrVertexShaderV4));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, kerrFragmentShaderV4));
    gl.bindAttribLocation(p, 0, "position");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`program link failed: ${gl.getProgramInfoLog(p)}`);
    this.program = p;
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  private u(name: string) {
    if (!this.loc.has(name)) this.loc.set(name, this.gl.getUniformLocation(this.program, name));
    return this.loc.get(name)!;
  }

  /** Draw into the currently bound framebuffer at width×height. */
  draw(values: KerrUniformValuesV4, settings: KerrRenderSettingsV4, width: number, height: number, mode: 0 | 1 | 2 = 0, time = 0) {
    const gl = this.gl;
    const f = values.frame;
    gl.useProgram(this.program);
    gl.viewport(0, 0, width, height);
    gl.uniform2f(this.u("uResolution"), width, height);
    gl.uniform1f(this.u("uSpin"), f.spin);
    gl.uniform1f(this.u("uRh"), values.rh);
    gl.uniform1f(this.u("uCapture"), values.capture);
    gl.uniform1f(this.u("uRIn"), values.flux.rIn);
    gl.uniform1f(this.u("uROut"), values.flux.rOut);
    gl.uniform1f(this.u("uEscapeR"), values.escapeR);
    gl.uniform1f(this.u("uStepScale"), settings.stepScale);
    gl.uniform1i(this.u("uMaxSteps"), settings.maxSteps);
    gl.uniform3f(this.u("uCamPos"), f.position[0], f.position[1], f.position[2]);
    gl.uniform4fv(this.u("uU"), f.u);
    gl.uniform4fv(this.u("uEF"), f.eForward);
    gl.uniform4fv(this.u("uER"), f.eRight);
    gl.uniform4fv(this.u("uEU"), f.eUp);
    gl.uniformMatrix4fv(this.u("uG"), false, metricToMat4(f.metric));
    gl.uniform1f(this.u("uTanHalfFov"), f.tanHalfFovY);
    gl.uniform1f(this.u("uAspect"), f.aspect);
    gl.uniform4fv(this.u("uFlux4"), values.flux.values);
    gl.uniform3fv(this.u("uBB"), values.bb);
    gl.uniform4fv(this.u("uBBLogY4"), values.bbLogY);
    gl.uniform1f(this.u("uDiskTMax"), settings.diskTMax);
    gl.uniform1f(this.u("uExposure"), settings.exposure);
    gl.uniform1f(this.u("uStarBrightness"), settings.starBrightness);
    gl.uniform1f(this.u("uTime"), time);
    gl.uniform1f(this.u("uDiskDetail"), mode === 1 ? 0 : settings.diskDetail);
    gl.uniform1f(this.u("uLumGamma"), settings.luminanceGamma);
    gl.uniform1i(this.u("uMode"), mode);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Render diagnostics (status, r, g, order) into a float target and read them back. */
  diagnostics(values: KerrUniformValuesV4, settings: KerrRenderSettingsV4, width: number, height: number): Float32Array {
    const gl = this.gl;
    if (!gl.getExtension("EXT_color_buffer_float")) throw new Error("EXT_color_buffer_float unavailable");
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    this.draw(values, settings, width, height, 1);
    const out = new Float32Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, out);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(fb);
    gl.deleteTexture(tex);
    return out;
  }
}

// --- cinematic path: HDR render + physically-scaled bloom + ACES ------------

const fsVert = `#version 300 es
in vec2 position; out vec2 vUv;
void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }`;

const downFrag = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uSrc; uniform vec2 uTexel; out vec4 o;
void main() {
  vec3 c = texture(uSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb
         + texture(uSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  o = vec4(c * 0.25, 1.0);
}`;

const upFrag = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uSrc; uniform vec2 uTexel; out vec4 o;
void main() {
  vec3 c = vec3(0.0);
  c += texture(uSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb;
  c += texture(uSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
  c += 2.0 * (texture(uSrc, vUv + uTexel * vec2(-1.0, 0.0)).rgb + texture(uSrc, vUv + uTexel * vec2(1.0, 0.0)).rgb
            + texture(uSrc, vUv + uTexel * vec2(0.0, -1.0)).rgb + texture(uSrc, vUv + uTexel * vec2(0.0, 1.0)).rgb);
  c += 4.0 * texture(uSrc, vUv).rgb;
  o = vec4(c / 16.0, 1.0);
}`;

const compositeFrag = `#version 300 es
precision highp float; in vec2 vUv; uniform sampler2D uHdr; uniform sampler2D uBloom; uniform float uBloomStrength; out vec4 o;
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 srgb(vec3 c) { return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec3 c = texture(uHdr, vUv).rgb + uBloomStrength * texture(uBloom, vUv).rgb;
  o = vec4(srgb(aces(c)), 1.0);
}`;

type Target = { tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number };

export class KerrCinematicPipelineV4 {
  private gl: WebGL2RenderingContext;
  private tracer: KerrWebGLRendererV4;
  private down: WebGLProgram;
  private up: WebGLProgram;
  private comp: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private targets: Target[] = [];
  private key = "";
  readonly supported: boolean;
  bloomStrength = 0.28;
  levels = 6;

  constructor(gl: WebGL2RenderingContext, tracer: KerrWebGLRendererV4) {
    this.gl = gl;
    this.tracer = tracer;
    this.supported = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    const link = (fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, fsVert));
      gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, "position");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`post program link failed: ${gl.getProgramInfoLog(p)}`);
      return p;
    };
    this.down = link(downFrag);
    this.up = link(upFrag);
    this.comp = link(compositeFrag);
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  private ensure(w: number, h: number) {
    const key = `${w}x${h}`;
    if (key === this.key) return;
    const gl = this.gl;
    for (const t of this.targets) {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fb);
    }
    this.targets = [];
    let cw = w, ch = h;
    for (let i = 0; i <= this.levels; i++) {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, cw, ch, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      this.targets.push({ tex, fb, w: cw, h: ch });
      cw = Math.max(1, cw >> 1);
      ch = Math.max(1, ch >> 1);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.key = key;
  }

  private pass(prog: WebGLProgram, src: Target, dst: Target | null, w: number, h: number) {
    const gl = this.gl;
    gl.useProgram(prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
    gl.viewport(0, 0, w, h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.uniform1i(gl.getUniformLocation(prog, "uSrc"), 0);
    gl.uniform2f(gl.getUniformLocation(prog, "uTexel"), 1 / src.w, 1 / src.h);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Trace in HDR, bloom, tone-map to the default framebuffer. */
  render(values: KerrUniformValuesV4, settings: KerrRenderSettingsV4, width: number, height: number, time = 0) {
    const gl = this.gl;
    if (!this.supported) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.tracer.draw(values, settings, width, height, 0, time);
      return;
    }
    this.ensure(width, height);
    const T = this.targets;
    gl.bindFramebuffer(gl.FRAMEBUFFER, T[0].fb);
    this.tracer.draw(values, settings, width, height, 2, time);
    for (let i = 1; i < T.length; i++) this.pass(this.down, T[i - 1], T[i], T[i].w, T[i].h);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = T.length - 1; i > 1; i--) this.pass(this.up, T[i], T[i - 1], T[i - 1].w, T[i - 1].h);
    gl.disable(gl.BLEND);
    gl.useProgram(this.comp);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, T[0].tex);
    gl.uniform1i(gl.getUniformLocation(this.comp, "uHdr"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, T[1].tex);
    gl.uniform1i(gl.getUniformLocation(this.comp, "uBloom"), 1);
    gl.uniform1f(gl.getUniformLocation(this.comp, "uBloomStrength"), this.bloomStrength);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
  }
}
