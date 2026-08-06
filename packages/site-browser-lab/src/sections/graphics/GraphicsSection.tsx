import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@platform/ui";
import { SectionHeader } from "../../components/SectionHeader.js";
import { formatNumber } from "@platform/browser";
import styles from "./GraphicsSection.module.css";

const SHADERS = [
  {
    id: "plasma",
    label: "Plasma",
    frag: `
precision mediump float;
uniform float u_time;
uniform vec2 u_res;
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float v = sin(uv.x * 10.0 + u_time)
    + sin(uv.y * 10.0 + u_time * 1.3)
    + sin((uv.x + uv.y) * 8.0 + u_time * 0.7);
  v = v / 3.0 * 0.5 + 0.5;
  gl_FragColor = vec4(0.05, v * 0.85 + 0.15, v * 0.7 + 0.2, 1.0);
}`,
  },
  {
    id: "rings",
    label: "Rings",
    frag: `
precision mediump float;
uniform float u_time;
uniform vec2 u_res;
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float d = length(uv);
  float rings = abs(sin(d * 28.0 - u_time * 2.5));
  float glow = smoothstep(0.55, 0.0, d);
  gl_FragColor = vec4(0.02, rings * 0.9 * glow + 0.05, rings * 0.75 * glow + 0.08, 1.0);
}`,
  },
  {
    id: "noise",
    label: "Noise field",
    frag: `
precision mediump float;
uniform float u_time;
uniform vec2 u_res;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float n = hash(uv * 40.0 + u_time);
  float band = smoothstep(0.4, 0.6, sin(uv.y * 20.0 + u_time) * 0.5 + 0.5);
  gl_FragColor = vec4(0.04, n * 0.55 + band * 0.35, n * 0.4 + 0.1, 1.0);
}`,
  },
] as const;

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function linkProgram(gl: WebGLRenderingContext, fragSource: string): WebGLProgram | null {
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSource);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

export function GraphicsSection() {
  const shaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const [shaderId, setShaderId] = useState<(typeof SHADERS)[number]["id"]>("plasma");
  const [particleCount, setParticleCount] = useState(4000);
  const [fps, setFps] = useState(0);
  const [running, setRunning] = useState(true);
  const shaderIdRef = useRef(shaderId);
  shaderIdRef.current = shaderId;

  useEffect(() => {
    const canvas = shaderCanvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    let raf = 0;
    let prog: WebGLProgram | null = null;
    let currentId = "";

    const ensure = () => {
      const def = SHADERS.find((s) => s.id === shaderIdRef.current) ?? SHADERS[0];
      if (def.id === currentId && prog) return;
      currentId = def.id;
      if (prog) gl.deleteProgram(prog);
      prog = linkProgram(gl, def.frag);
      if (!prog) return;
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const loc = gl.getAttribLocation(prog, "a_pos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    const start = performance.now();
    const draw = (now: number) => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      gl.viewport(0, 0, canvas.width, canvas.height);
      ensure();
      if (prog) {
        const tLoc = gl.getUniformLocation(prog, "u_time");
        const rLoc = gl.getUniformLocation(prog, "u_res");
        gl.uniform1f(tLoc, (now - start) / 1000);
        gl.uniform2f(rLoc, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const canvas = particleCanvasRef.current;
    if (!canvas || !running) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const count = particleCount;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.004,
      vy: (Math.random() - 0.5) * 0.004,
    }));

    let last = performance.now();
    let frames = 0;
    let fpsAccum = 0;

    const draw = (now: number) => {
      const dt = now - last;
      last = now;
      frames += 1;
      fpsAccum += dt;
      if (fpsAccum >= 500) {
        setFps(Math.round((frames * 1000) / fpsAccum));
        frames = 0;
        fpsAccum = 0;
      }

      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "rgba(6, 10, 12, 0.35)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#2dd4bf";
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        ctx.fillRect(p.x * w, p.y * h, 2, 2);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [particleCount, running]);

  const bumpParticles = useCallback((delta: number) => {
    setParticleCount((n) => Math.max(500, Math.min(40000, n + delta)));
  }, []);

  return (
    <section aria-labelledby="lab-graphics-title">
      <SectionHeader
        eyebrow="Render Bay"
        title="Graphics"
        description="A small WebGL fragment-shader gallery and a live particle stress test with object count and FPS monitoring."
      />

      <div className={styles.grid}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Shader gallery</h3>
            <div className={styles.shaderTabs} role="tablist" aria-label="Shader toys">
              {SHADERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={shaderId === s.id}
                  className={`${styles.tab} ${shaderId === s.id ? styles.tabActive : ""}`}
                  onClick={() => setShaderId(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <canvas
            ref={shaderCanvasRef}
            className={styles.canvas}
            aria-label="WebGL shader preview"
          />
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h3 className={styles.panelTitle}>Particle stress</h3>
            <p className={styles.meter}>
              {formatNumber(particleCount)} objects · {fps} FPS
            </p>
          </div>
          <canvas
            ref={particleCanvasRef}
            className={styles.canvas}
            aria-label="Particle stress canvas"
          />
          <div className={styles.controls}>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => bumpParticles(-2000)}
            >
              −2k
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => bumpParticles(2000)}>
              +2k
            </Button>
            <Button type="button" size="sm" onClick={() => setRunning((r) => !r)}>
              {running ? "Pause" : "Resume"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
