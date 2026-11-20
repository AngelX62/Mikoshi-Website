type Point3 = Readonly<{ x: number; y: number; z: number }>;
type Point2 = Readonly<{ x: number; y: number; depth: number }>;
type Shell = Readonly<{
  name: "large" | "small";
  side: -1 | 1;
  yaw: number;
  separation: number;
  depth: number;
}>;

const RADIUS = 225;
const CUT = 32;
const HALF_EDGE = 15;
const Y_LIMIT = Math.sqrt(RADIUS * RADIUS - CUT * CUT);
const CAMERA = 1800;
const SCALE = 1.18;
const PITCH = (14 * Math.PI) / 180;
const ROLL = (-23 * Math.PI) / 180;
const SHELLS: readonly Shell[] = [
  { name: "large", side: -1, yaw: (-19 * Math.PI) / 180, separation: -27, depth: 0 },
  { name: "small", side: 1, yaw: (28 * Math.PI) / 180, separation: 36, depth: 20 },
];

const n = (value: number) => Number(value.toFixed(2));

/** A shallow, lathed biconvex lens with a real, finite outer edge. */
function surface(x: number, y: number, front: boolean): number {
  const radial = Math.max(0, 1 - (x * x + y * y) / (RADIUS * RADIUS));
  const rise = Math.pow(radial, 1.08);
  return front ? HALF_EDGE + 47 * rise : -HALF_EDGE - 29 * rise;
}

function rotate(point: Point3, yaw: number): Point3 {
  const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
  const z = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  const y = point.y * Math.cos(PITCH) - z * Math.sin(PITCH);
  const depth = point.y * Math.sin(PITCH) + z * Math.cos(PITCH);
  return {
    x: x * Math.cos(ROLL) - y * Math.sin(ROLL),
    y: x * Math.sin(ROLL) + y * Math.cos(ROLL),
    z: depth,
  };
}

function project(point: Point3, shell: Shell): Point2 {
  // Each part opens about the cut, rather than rotating around its own centre.
  const local = rotate({ x: point.x - CUT, y: point.y, z: point.z }, shell.yaw);
  const offset = rotate({ x: CUT + shell.separation, y: 0, z: shell.depth }, 0);
  const depth = local.z + offset.z;
  const perspective = CAMERA / (CAMERA - depth);
  return {
    x: 401 + (local.x + offset.x) * SCALE * perspective,
    y: 326 - (local.y + offset.y) * SCALE * perspective,
    depth,
  };
}

function path(points: readonly Point2[], close = true): string {
  return `${points.map((point, index) => `${index === 0 ? "M" : "L"}${n(point.x)} ${n(point.y)}`).join(" ")}${close ? " Z" : ""}`;
}

function cutProfile(shell: Shell, front: boolean, reverse = false): Point2[] {
  return Array.from({ length: 101 }, (_, index) => {
    const t = (reverse ? 100 - index : index) / 100;
    const y = -Y_LIMIT + 2 * Y_LIMIT * t;
    return project({ x: CUT, y, z: surface(CUT, y, front) }, shell);
  });
}

function rimProfile(shell: Shell, front: boolean): Point2[] {
  const angle = Math.acos(CUT / RADIUS);
  const start = shell.side === -1 ? angle : -angle;
  const end = shell.side === -1 ? 2 * Math.PI - angle : angle;
  return Array.from({ length: 121 }, (_, index) => {
    const theta = start + ((end - start) * index) / 120;
    const x = RADIUS * Math.cos(theta);
    const y = RADIUS * Math.sin(theta);
    return project({ x, y, z: front ? HALF_EDGE : -HALF_EDGE }, shell);
  });
}

function shellGeometry(shell: Shell) {
  const frontCut = cutProfile(shell, true);
  const backCut = cutProfile(shell, false);
  const frontRim = rimProfile(shell, true);
  const backRim = rimProfile(shell, false);
  const face = path([
    ...frontRim,
    ...(shell.side === -1 ? frontCut : [...frontCut].reverse()),
  ]);
  const rear = path([
    ...backRim,
    ...(shell.side === -1 ? backCut : [...backCut].reverse()),
  ]);
  const cutWall = path([...frontCut, ...[...backCut].reverse()]);
  const bounds = [...frontRim, ...backRim, ...frontCut, ...backCut];
  const minX = Math.min(...bounds.map((point) => point.x));
  const maxX = Math.max(...bounds.map((point) => point.x));
  const minY = Math.min(...bounds.map((point) => point.y));
  const maxY = Math.max(...bounds.map((point) => point.y));
  const centre = project({ x: 0, y: 0, z: HALF_EDGE }, shell);
  const axisX = project({ x: RADIUS, y: 0, z: HALF_EDGE }, shell);
  const axisY = project({ x: 0, y: RADIUS, z: HALF_EDGE }, shell);
  const diffuse = project({ x: -65, y: 105, z: surface(-65, 105, true) }, shell);
  const ellipse = [axisX.x - centre.x, axisX.y - centre.y, axisY.x - centre.x, axisY.y - centre.y];
  const materialTransform = `matrix(${ellipse.map(n).join(" ")} ${n(centre.x)} ${n(centre.y)})`;
  const diffuseTransform = `matrix(${ellipse.map((value) => n(value * 1.05)).join(" ")} ${n(diffuse.x)} ${n(diffuse.y)})`;
  const angle = Math.acos(CUT / RADIUS);
  const start = shell.side === -1 ? angle : -angle;
  const end = shell.side === -1 ? 2 * Math.PI - angle : angle;

  // The outer edge is tessellated in 3D. Only camera-facing edge facets render;
  // the large matte face stays a continuous surface, without visible polygons.
  const rim = Array.from({ length: 120 }, (_, index) => {
    const a = start + ((end - start) * index) / 120;
    const b = start + ((end - start) * (index + 1)) / 120;
    const middle = (a + b) / 2;
    const normal = rotate({ x: Math.cos(middle), y: Math.sin(middle), z: 0 }, shell.yaw);
    const light = Math.max(0, -normal.x * 0.35 + normal.y * 0.7 + normal.z * 0.5);
    const value = Math.round(21 + light * 42);
    const points = [
      { x: RADIUS * Math.cos(a), y: RADIUS * Math.sin(a), z: HALF_EDGE },
      { x: RADIUS * Math.cos(b), y: RADIUS * Math.sin(b), z: HALF_EDGE },
      { x: RADIUS * Math.cos(b), y: RADIUS * Math.sin(b), z: -HALF_EDGE },
      { x: RADIUS * Math.cos(a), y: RADIUS * Math.sin(a), z: -HALF_EDGE },
    ].map((point) => project(point, shell));
    return {
      visible: normal.z > -0.015,
      d: path(points),
      fill: `rgb(${value} ${value + 2} ${value + 2})`,
      depth: points.reduce((total, point) => total + point.depth, 0) / points.length,
    };
  }).filter((segment) => segment.visible).sort((a, b) => a.depth - b.depth);

  return {
    face,
    rear,
    cutWall,
    frontRim: path(frontRim, false),
    frontCut: path(frontCut, false),
    backCut: path(backCut, false),
    cutFront: project({ x: CUT, y: 0, z: surface(CUT, 0, true) }, shell),
    cutBack: project({ x: CUT, y: 0, z: surface(CUT, 0, false) }, shell),
    minX,
    maxX,
    minY,
    maxY,
    materialTransform,
    diffuseTransform,
    rim,
  };
}

const GEOMETRY = SHELLS.map((shell) => ({ shell, shape: shellGeometry(shell) }));

const MOTION = `
  .lens-sculpture { display: block; width: 100%; height: auto; overflow: visible; }
  .lens-sculpture .lens-stage { transform-origin: 401px 326px; }
  .lens-sculpture .lens-shell--large { transform-origin: 346px 333px; }
  .lens-sculpture .lens-shell--small { transform-origin: 502px 311px; }
  @media (scripting: enabled) and (prefers-reduced-motion: no-preference) {
    .lens-sculpture .lens-stage {
      animation: lens-settle 3s cubic-bezier(.19,.76,.24,1) both;
    }
    .lens-sculpture .lens-shell--large {
      animation: lens-open-large 3s cubic-bezier(.19,.76,.24,1) both;
    }
    .lens-sculpture .lens-shell--small {
      animation: lens-open-small 3s cubic-bezier(.19,.76,.24,1) both;
    }
  }
  @keyframes lens-settle {
    from { transform: translate(0px, 9px) rotate(-4.5deg) skewY(-1.5deg) scale(.975); }
    to { transform: none; }
  }
  @keyframes lens-open-large {
    from { transform: translate(38px, 16px) rotate(2deg); }
    to { transform: none; }
  }
  @keyframes lens-open-small {
    from { transform: translate(-46px, -19px) rotate(-3deg); }
    to { transform: none; }
  }
`;

/** Decorative, server-rendered geometry. No hooks, canvas, assets, or runtime loop. */
export function SplitLens({ idPrefix = "split-lens" }: { idPrefix?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="lens-sculpture"
      viewBox="0 0 800 650"
      width="800"
      height="650"
      aria-hidden="true"
      focusable="false"
    >
      <style>{MOTION}</style>
      <defs>
        {GEOMETRY.map(({ shell, shape }) => {
          const id = `${idPrefix}-${shell.name}`;
          return (
            <g key={id}>
              <radialGradient id={`${id}-graphite`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform={shape.materialTransform}>
                <stop offset="0" stopColor="#464847" />
                <stop offset=".35" stopColor="#434645" />
                <stop offset=".62" stopColor="#373b3a" />
                <stop offset=".8" stopColor="#2b2f2e" />
                <stop offset=".93" stopColor="#1f2423" />
                <stop offset="1" stopColor="#141a19" />
              </radialGradient>
              <radialGradient id={`${id}-satin`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform={shape.diffuseTransform}>
                <stop offset="0" stopColor="#e0d7c6" stopOpacity=".25" />
                <stop offset=".26" stopColor="#d4cebe" stopOpacity=".18" />
                <stop offset=".57" stopColor="#d4cebe" stopOpacity=".07" />
                <stop offset=".86" stopColor="#d4cebe" stopOpacity="0" />
                <stop offset="1" stopColor="#d4cebe" stopOpacity="0" />
              </radialGradient>
              <linearGradient id={`${id}-oxblood`} gradientUnits="userSpaceOnUse" x1={shape.cutFront.x} y1={shape.cutFront.y} x2={shape.cutBack.x} y2={shape.cutBack.y}>
                <stop offset="0" stopColor="#201416" />
                <stop offset=".08" stopColor="#6b2830" />
                <stop offset=".22" stopColor="#a44f55" />
                <stop offset=".285" stopColor="#ddb2a8" />
                <stop offset=".32" stopColor="#b36a6a" />
                <stop offset=".42" stopColor="#66232e" />
                <stop offset=".66" stopColor="#3b1520" />
                <stop offset=".86" stopColor="#200f16" />
                <stop offset="1" stopColor="#0c1012" />
              </linearGradient>
              <linearGradient id={`${id}-cut-light`} gradientUnits="userSpaceOnUse" x1={shape.minX} y1={shape.minY} x2={shape.maxX} y2={shape.maxY}>
                <stop offset="0" stopColor="#f4d4ba" stopOpacity=".67" />
                <stop offset=".38" stopColor="#bd827a" stopOpacity=".2" />
                <stop offset=".64" stopColor="#4d3235" stopOpacity=".05" />
                <stop offset="1" stopColor="#ad8c7d" stopOpacity=".25" />
              </linearGradient>
            </g>
          );
        })}
      </defs>
      <g className="lens-stage">
        {GEOMETRY.map(({ shell, shape }) => {
          const id = `${idPrefix}-${shell.name}`;
          return (
            <g key={id} className={`lens-shell lens-shell--${shell.name}`}>
              <path d={shape.rear} fill="#151a1b" />
              {shape.rim.map((segment, index) => (
                <path key={index} d={segment.d} fill={segment.fill} stroke={segment.fill} strokeWidth=".45" strokeLinejoin="round" />
              ))}
              <path d={shape.cutWall} fill={`url(#${id}-oxblood)`} />
              <path d={shape.backCut} fill="none" stroke="#080e10" strokeWidth="1.3" />
              <path d={shape.face} fill={`url(#${id}-graphite)`} />
              <path d={shape.face} fill={`url(#${id}-satin)`} />
              <path d={shape.frontRim} fill="none" stroke={`url(#${id}-cut-light)`} strokeWidth=".8" />
              <path d={shape.frontCut} fill="none" stroke={`url(#${id}-cut-light)`} strokeWidth=".95" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
