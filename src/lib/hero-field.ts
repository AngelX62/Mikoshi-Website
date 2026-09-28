/** A transparent particle surface. No image or texture is sampled. */

/**
 * The switch for the gradient descent. `false` is the wave exactly as it was
 * before 23 September 2026, bit for bit.
 *
 * ── WHAT IT DOES ─────────────────────────────────────────────────────────────
 * The field already read as a loss landscape, and the user noticed: a surface
 * that rises and falls, with a rose thread across it. The reading was accidental,
 * because the thread ran at one fixed depth straight across the sheet, rising and
 * falling with the waves instead of heading downhill.
 *
 * On, three things change and nothing else does:
 *   1. **A shallow valley under the logo.** A static basin, wide and about 22px
 *      deep at 1440, where the waves also calm, as a loss surface flattens near a
 *      minimum. Everywhere else the field moves exactly as before.
 *   2. **The rose thread becomes the descent.** It starts high on the right of the
 *      sheet and runs down into the valley, with a small zigzag across the slope
 *      that dies out as it arrives. That zigzag is how gradient descent actually
 *      crosses a narrow valley, so it is the true signature of the thing, not an
 *      ornament. Simulated at three moments of the animation, the path runs
 *      downhill on screen at all of them.
 *   3. **It fades in and it stops.** A descent ends at its minimum, so the thread
 *      ends softly just past the valley floor instead of running on across the
 *      sheet. No dots, steps, arrows or labels: it has to stay a picture.
 *
 * **To go back:** set this to `false`. Or, for the file exactly as it was, copy
 * `backups/hero-field.ts.2026-09-23.bak` over this one. The file is untracked in
 * git, so git cannot restore it.
 */
const DESCENT = true;

const vertexSource = `
precision highp float;
attribute vec4 aSeed;
uniform float uTime;
// 1.0 for the gradient descent, 0.0 for the original thread. See DESCENT above.
uniform float uDescent;
uniform float uDensity;
uniform vec2 uPointer;
uniform vec3 uInk;
uniform vec3 uRose;
// Canvas height over width, and where the mark sits in clip space. The mark is
// authored in a square space and squeezed on x here, because clip space is not
// square and the mark's ink bbox is exactly 64 by 64.
uniform float uAspect;
uniform vec2 uMark;
uniform float uMarkZ;
varying vec4 vColor;
varying float vKind;
void main() {
  vKind = aSeed.w;
  if (aSeed.w > 0.5) {
    vec2 p = aSeed.xy * vec2(uAspect, 1.0) + uMark;
    // **The mark is an object at a depth in this field, not a decal on the front
    // of it.** It used to take a flat uPointer * 0.008 while the particles
    // around it moved by up to four times that, so it slid against the field it
    // was supposed to be sitting in. This is the particles' own parallax
    // expression evaluated at the mark's depth, so it travels with the grains
    // beside it and against the ones in front.
    // No backticks in this file's shaders: they are template literals.
    p += uPointer * vec2(0.035, 0.025) * (uMarkZ + 2.0) / 3.7;
    // A slow sway on the field's own clock. Without it the one hard edged thing
    // on the canvas is also the only still thing on it, which is what made it
    // read as pasted on when the pointer was nowhere near.
    p += vec2(sin(uTime * 0.17) * 0.004, sin(uTime * 0.23 + 1.1) * 0.005);
    gl_Position = vec4(p, 0.0, 1.0);
    gl_PointSize = 1.0;
    vColor = vec4(aSeed.w > 1.5 ? uRose : uInk, 1.0);
    return;
  }
  float u = aSeed.x;
  float v = aSeed.y;
  float x = (u - 0.5) * 7.0;
  float z = (v - 0.5) * 3.4;
  float y = sin(x * 0.85 + z * 0.55 + uTime * 0.30) * 0.32
    + sin(z * 1.45 - x * 0.35 - uTime * 0.22) * 0.15
    + exp(-(x - 0.3) * (x - 0.3) * 0.45) * sin(z * 2.3 + uTime * 0.18) * 0.25;
  // The valley under the logo: centred just in front of the mark's depth, wide
  // and shallow, and the waves settle towards its floor. Static, so the minimum
  // stays put while the rest of the landscape moves.
  float basin = exp(-((x - 0.05) * (x - 0.05) + 2.0 * (z + 0.15) * (z + 0.15)) * 0.5);
  y = mix(y, y - 0.18 * basin, uDescent);
  float perspective = 4.8 / (4.8 + z * 0.18);
  vec2 point = vec2((x + z * 0.12) / 3.7, (y * 0.85 - z * 0.46) / 1.6) * perspective;
  point.y += point.x * 0.16 - 0.18;
  point += uPointer * vec2(0.035, 0.025) * (z + 2.0) / 3.7;
  gl_Position = vec4(point, 0.0, 1.0);
  gl_PointSize = uDensity * (0.85 + aSeed.z * 0.75) * perspective;
  float edge = smoothstep(0.02, 0.24, u) * (1.0 - smoothstep(0.94, 1.0, u))
    * smoothstep(0.0, 0.06, v) * (1.0 - smoothstep(0.94, 1.0, v));
  float thread = 1.0 - smoothstep(0.025, 0.065, abs(v - 0.51));
  // The descent: progress s runs 0 at the start, high on the right, to 1 at the
  // valley floor. Eased so the path has no corners, with a zigzag across the
  // slope that shrinks to nothing as it arrives. Same width as the thread: 0.085
  // to 0.22 in z is 0.025 to 0.065 in v. No negative-range smoothstep: its
  // result is undefined in GLSL, so the fades are written as 1.0 - smoothstep.
  float s = clamp((2.7 - x) / 2.65, 0.0, 1.0);
  float zPath = mix(-0.95, -0.15, s * s * (3.0 - 2.0 * s))
    + 0.22 * (1.0 - s) * (1.0 - s) * sin(s * 9.42478);
  float path = (1.0 - smoothstep(0.085, 0.22, abs(z - zPath)))
    * (1.0 - smoothstep(2.3, 2.9, x))
    * smoothstep(-0.35, 0.05, x);
  float rose = mix(thread, path, uDescent);
  gl_PointSize += rose * uDensity * 0.3;
  vColor = vec4(mix(uInk, uRose, rose), edge * (0.30 + aSeed.z * 0.36 + rose * 0.22));
}
`;
const fragmentSource = `
precision mediump float;
varying vec4 vColor;
varying float vKind;
void main() {
  float coverage = 1.0;
  if (vKind < 0.5) coverage = 1.0 - smoothstep(0.30, 0.50, length(gl_PointCoord - 0.5));
  gl_FragColor = vec4(vColor.rgb, vColor.a * coverage);
}
`;
type Color = [number, number, number];
export type FieldRenderer = {
  animated: boolean;
  draw: (time: number, pointerX: number, pointerY: number) => void;
  resize: (width: number, height: number, ratio: number) => void;
  dispose: () => void;
};
function noise(index: number) {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}
export function createHeroField(canvas: HTMLCanvasElement, ink: Color, rose: Color): FieldRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true, antialias: false, depth: false, premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  if (!gl) return createStillField(canvas, ink, rose);
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const points: number[] = [];
  const columns = 320;
  const rows = 110;
  /**
   * How deep into the field the mark stands.
   *
   * The grid is built row by row and a row's `v` is what becomes `z` in the
   * vertex shader, so **the buffer is already sorted back to front** and a depth
   * is just an index. That is what makes the split below free: no sorting, no
   * depth buffer, one extra draw call.
   *
   * 0.15 rather than 0 so the rose thread, which runs at `v` about 0.51, falls
   * on the near side and crosses in front of the mark rather than vanishing
   * behind it. That thread passing over the black is the one moment where the
   * two elements visibly occupy the same space.
   *
   * With `DESCENT` on, the thread no longer crosses the mark: it ends in the
   * valley just below it, on the near side of this depth, so it is still drawn
   * in front.
   */
  const MARK_Z = 0.15;
  const splitRow = Math.round((MARK_Z / 3.4 + 0.5) * rows);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const seed = noise(row * columns + column);
      points.push((column + seed * 0.85) / columns, (row + noise(column * rows + row) * 0.85) / rows, seed, 0);
    }
  }
  const pointCount = points.length / 4;
  const quad = (left: number, bottom: number, right: number, top: number, kind: number) => {
    for (const [x, y] of [[left, bottom], [right, bottom], [left, top], [left, top], [right, bottom], [right, top]]) {
      points.push(x, y, 0, kind);
    }
  };
  // ── The mark, drawn in the field rather than laid over it ──────────────────
  // This was four bars forming a **closed** rectangle, and closed it was not the
  // mark: it read as an empty placeholder frame, and it contradicted the lockup
  // in the header directly above it.
  //
  // `MARK_PATHS.ink` in lib/logo.ts is two L forms related by a half turn, and
  // the thing that makes them mean anything is the **corner they leave open**,
  // with the register square displaced out through the gap. Close the corner and
  // the reading goes with it.
  //
  // Proportions come from the mark itself, whose two L forms occupy a square 64
  // units on a side inside its 104 box. Each arm runs three quarters of the way
  // across, so each L stops one quarter short and the opposite corner is open.
  //
  // **This is the mark itself, not a line reduction of it.** It was drawn as
  // thin bars for a while, which had the right topology and the wrong weight:
  // the logo's arms are 16 of its 64 units, a full quarter of the side, and a
  // hairline outline of the same shape is a different drawing.
  //
  // `MARK_PATHS.ink` is two hexagons and each one is exactly two overlapping
  // rectangles, so the whole form is four quads and no triangulation:
  //
  //   L1  M16 24 h48 v16 H32 v32 H16 Z   = x16..64 y24..40  +  x16..32 y24..72
  //   L2  M32 72 h32 V40 h16 v48 H32 Z   = x64..80 y40..88  +  x32..80 y72..88
  //
  // The overlaps are harmless: these fragments are opaque, so drawing a pixel
  // twice lands the same ink.
  //
  // **Authored in square space and squared by the shader.** These are not clip
  // space coordinates; the vertex shader multiplies x by `uAspect`. Written
  // straight into clip space the box came out 11% taller than wide on a 4:3
  // canvas, for a mark whose ink bbox is exactly 64 by 64.
  //
  // `H` is the half side, so one mark unit is `H / 32` and the ink bbox
  // x16..80 y24..88 maps onto -H..H with y flipped. `H` is scale alone and is
  // the one number to change if the mark wants to be bigger or smaller.
  const H = 0.2;
  // Upper left L. Top arm, then left arm. Leaves the top right corner open.
  quad(-H, 0.5 * H, 0.5 * H, H, 1);
  quad(-H, -0.5 * H, -0.5 * H, H, 1);
  // Lower right L, the same form turned half a turn. Leaves the bottom left open.
  quad(0.5 * H, -H, H, 0.5 * H, 1);
  quad(-0.5 * H, -H, H, -0.5 * H, 1);
  // The register square: 16 units again, at x72..88 y16..32, so it straddles the
  // open corner half in and half out. That displacement is the whole mark.
  quad(0.75 * H, 0.75 * H, 1.25 * H, 1.25 * H, 2);
  const buffer = gl.createBuffer();
  if (!buffer) { gl.deleteProgram(program); return null; }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  const attribute = gl.getAttribLocation(program, "aSeed");
  gl.enableVertexAttribArray(attribute);
  gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 0, 0);
  gl.uniform3fv(gl.getUniformLocation(program, "uInk"), ink);
  gl.uniform3fv(gl.getUniformLocation(program, "uRose"), rose);
  const timeUniform = gl.getUniformLocation(program, "uTime");
  const pointerUniform = gl.getUniformLocation(program, "uPointer");
  const densityUniform = gl.getUniformLocation(program, "uDensity");
  const aspectUniform = gl.getUniformLocation(program, "uAspect");
  // Where the mark's centre sits in clip space. Not aspect corrected: this is a
  // position rather than a size.
  gl.uniform2f(gl.getUniformLocation(program, "uMark"), 0.02, 0.14);
  gl.uniform1f(gl.getUniformLocation(program, "uMarkZ"), MARK_Z);
  gl.uniform1f(gl.getUniformLocation(program, "uDescent"), DESCENT ? 1 : 0);
  gl.enable(gl.BLEND);
  // Separate alpha factors keep the transparent framebuffer premultiplied.
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);
  let pointStep = 1;
  return {
    animated: true,
    draw(time, pointerX, pointerY) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeUniform, time);
      gl.uniform2f(pointerUniform, pointerX, pointerY);
      // ── FAR GRAINS, THEN THE MARK, THEN NEAR GRAINS ────────────────────────
      // The whole field used to be drawn over the mark, which meant nothing was
      // ever behind it and it read as a plane of its own. Splitting the field at
      // the mark's depth puts it inside the scene: the wave now visibly runs out
      // at its edge on the far side and carries on across it on the near side.
      //
      // Free because the buffer is already depth ordered, so each half is a
      // contiguous range. `first` counts strided vertices, so the split scales
      // with `pointStep` and stays on a row boundary at either density.
      const perRow = columns / pointStep;
      const near = splitRow * perRow;
      gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, pointStep * 16, 0);
      gl.drawArrays(gl.POINTS, near, pointCount / pointStep - near);
      gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, 16, 0);
      gl.drawArrays(gl.TRIANGLES, pointCount, 30);
      gl.vertexAttribPointer(attribute, 4, gl.FLOAT, false, pointStep * 16, 0);
      gl.drawArrays(gl.POINTS, 0, near);
    },
    resize(width, height, ratio) {
      pointStep = width < 600 ? 2 : 1;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      gl.viewport(0, 0, canvas.width, canvas.height);
      // Measured rather than assumed to be 4:3, which is only what the surface's
      // `aspect-ratio` happens to say today.
      gl.uniform1f(aspectUniform, height / width);
      gl.uniform1f(densityUniform, ratio * Math.max(0.65, Math.min(width / 1000, 1.2)));
    },
    dispose() { gl.deleteBuffer(buffer); gl.deleteProgram(program); },
  };
}
/** A lightweight still drawing for devices without WebGL, also transparent. */
function createStillField(canvas: HTMLCanvasElement, ink: Color, rose: Color): FieldRenderer | null {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const colors = [ink, rose].map(color => "rgb(" + color.map(value => Math.round(value * 255)).join(",") + ")");
  return {
    animated: false,
    resize(width, height, ratio) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    },
    draw() {
      const { width, height } = canvas;
      context.clearRect(0, 0, width, height);
      // The same five rectangles as the animated path, at the mark's own arm
      // thickness of 16 in 64. Sized off `height` on both axes so the 64 by 64
      // ink bbox stays square whatever the canvas is. `half` matches `H` there:
      // H * height / 2.
      const half = height * 0.1;
      const cx = width * 0.51;
      const cy = height * 0.43;
      context.fillStyle = colors[0];
      // Upper left L: top arm then left arm. Leaves the top right corner open.
      context.fillRect(cx - half, cy - half, half * 1.5, half * 0.5);
      context.fillRect(cx - half, cy - half, half * 0.5, half * 1.5);
      // Lower right L, the same form turned half a turn.
      context.fillRect(cx + half * 0.5, cy - half * 0.5, half * 0.5, half * 1.5);
      context.fillRect(cx - half * 0.5, cy + half * 0.5, half * 1.5, half * 0.5);
      // The register square, straddling the corner they leave open.
      context.fillStyle = colors[1];
      context.fillRect(cx + half * 0.75, cy - half * 1.25, half * 0.5, half * 0.5);
      for (let row = 0; row < 70; row++) {
        for (let column = 0; column < 220; column++) {
          const seed = noise(row * 220 + column);
          const u = (column + seed * 0.85) / 220;
          const v = (row + seed * 0.85) / 70;
          const x = (u - 0.5) * 7;
          const z = (v - 0.5) * 3.4;
          let y = Math.sin(x * 0.85 + z * 0.55) * 0.32 + Math.sin(z * 1.45 - x * 0.35) * 0.15
            + Math.exp(-Math.pow(x - 0.3, 2) * 0.45) * Math.sin(z * 2.3) * 0.25;
          // The same valley and path as the shader. See DESCENT at the top.
          let onThread = Math.abs(v - 0.51) < 0.045;
          if (DESCENT) {
            const basin = Math.exp(-(Math.pow(x - 0.05, 2) + 2 * Math.pow(z + 0.15, 2)) * 0.5);
            y = y - 0.18 * basin;
            const s = Math.min(1, Math.max(0, (2.7 - x) / 2.65));
            const zPath = -0.95 + (-0.15 + 0.95) * s * s * (3 - 2 * s)
              + 0.22 * (1 - s) * (1 - s) * Math.sin(s * 9.42478);
            onThread = Math.abs(z - zPath) < 0.15 && x < 2.6 && x > -0.15;
          }
          const perspective = 4.8 / (4.8 + z * 0.18);
          const px = (x + z * 0.12) / 3.7 * perspective;
          const py = (y * 0.85 - z * 0.46) / 1.6 * perspective + px * 0.16 - 0.18;
          context.globalAlpha = Math.min(1, Math.max(0, (u - 0.02) / 0.22)) * Math.min(1, (1 - u) / 0.06) * (0.3 + seed * 0.25);
          context.fillStyle = colors[onThread ? 1 : 0];
          const size = Math.max(0.7, width / 1100);
          context.fillRect((px + 1) * width / 2, (1 - py) * height / 2, size, size);
        }
      }
      context.globalAlpha = 1;
    },
    dispose() {},
  };
}
