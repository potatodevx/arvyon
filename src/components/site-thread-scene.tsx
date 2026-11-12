"use client";

import { Environment } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Mesh,
  Vector2,
  Vector3,
} from "three";
import { RibbonFallback } from "@/components/ribbon-fallback";

const WIDTH_SEGMENTS = 14;
const CAMERA_START_Y = 2.5;
const CAMERA_TRAVEL = 41.5;
const INTRO_END_Y = 0.5;
const HEAD_LEAD = 0.55;
const RIBBON_WIDTH = 0.95;
const MAX_ROLL = 1.2;

type ScenePreferences = { compact: boolean; reducedMotion: boolean; finePointer: boolean };

type Ribbon = {
  geometry: BufferGeometry;
  segments: number;
  base: Float32Array;
  baseNormals: Float32Array;
  pathY: Float32Array;
  introIndex: number;
  notchSegments: number;
};

/** Saturated red silk: the scene is deliberately the same oxblood signal as the interface. */
const silkMaterial = {
  color: "#b01227",
  emissive: "#2a0208",
  emissiveIntensity: 0.1,
  metalness: 0.04,
  roughness: 0.4,
  sheen: 0.85,
  sheenColor: "#ff4a5c",
  sheenRoughness: 0.45,
  clearcoat: 0.4,
  clearcoatRoughness: 0.22,
  envMapIntensity: 1,
  side: DoubleSide,
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

function getWebGLSupport() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function useScenePreferences(): ScenePreferences {
  const [preferences, setPreferences] = useState<ScenePreferences>({ compact: false, reducedMotion: false, finePointer: false });

  useEffect(() => {
    const compactQuery = window.matchMedia("(max-width: 699px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const update = () => setPreferences({
      compact: compactQuery.matches,
      reducedMotion: motionQuery.matches,
      finePointer: pointerQuery.matches,
    });

    update();
    compactQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    pointerQuery.addEventListener("change", update);
    return () => {
      compactQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
      pointerQuery.removeEventListener("change", update);
    };
  }, []);

  return preferences;
}

/** Design coordinates assume a 16:10-ish display; x adapts gently to the actual aspect ratio. */
function createStoryCurve(xScale: number) {
  const design: Array<[number, number, number]> = [
    // 01 — a loose idea wanders in from the left, then finds the page.
    [-9.0, 3.7, -0.4], [-6.0, 4.1, 0.1], [-3.0, 4.0, 0.5], [-0.2, 3.5, 0.1], [2.2, 3.5, -0.3],
    [3.9, 2.7, 0.3], [3.6, 1.3, -0.2], [2.2, 0.5, 0.35], [0.4, -0.2, -0.2], [-1.2, -1.2, 0.3],
    // 02–03 — the point of view becomes a generous loop around the work.
    [-2.18, -3.08, -0.16], [-1.74, -4.42, 0.28], [-0.48, -5.24, -0.2], [1.18, -5.82, 0.3],
    [2.56, -7.02, -0.18], [2.28, -8.52, 0.26], [1.16, -9.62, -0.2], [-0.42, -10.18, 0.26],
    [-1.82, -11.58, -0.18], [-1.52, -13.08, 0.3], [-0.18, -14.28, -0.16], [1.52, -15.04, 0.28],
    [2.72, -16.32, -0.2], [2.18, -17.9, 0.26], [0.86, -18.72, -0.18], [-0.94, -19.52, 0.3],
    // 04 — smaller, deliberate curves through the craft.
    [-2.26, -20.84, -0.16], [-2.02, -22.3, 0.28], [-0.7, -23.68, -0.2], [1.12, -24.32, 0.26],
    [2.58, -25.7, -0.18], [2.18, -27.18, 0.3], [0.66, -28.14, -0.16], [-1.1, -29.48, 0.28],
    // 05 — it resolves into a measured route through the method.
    [-2.34, -30.82, -0.2], [-1.9, -32.34, 0.26], [-0.2, -33.72, -0.18], [1.42, -34.62, 0.3],
    [2.42, -36.1, -0.16], [1.76, -37.5, 0.28], [0.24, -38.26, -0.2], [-1.44, -39.22, 0.26],
    // 06 — its end reaches the final knot.
    [-2.48, -40.48, -0.16],
  ];

  return new CatmullRomCurve3(
    design.map(([x, y, z]) => new Vector3(x * xScale, y, z)),
    false,
    "catmullrom",
    0.5,
  );
}

/**
 * Generates a continuous satin strip. The ribbon rolls into turns rather than merely
 * translating a flat plane, so its highlights behave like folded cloth.
 */
function createRibbon(curve: CatmullRomCurve3, width: number, segments: number): Ribbon {
  const columns = WIDTH_SEGMENTS + 1;
  const rows = segments + 1;
  const half = width / 2;
  const length = curve.getLength();
  const centre = new Float32Array(rows * 3);
  const tangents = new Float32Array(rows * 3);
  const point = new Vector3();
  const tangent = new Vector3();
  const tangentAhead = new Vector3();
  const tangentBehind = new Vector3();
  const roll = new Float32Array(rows);
  const delta = 3 / segments;

  for (let row = 0; row < rows; row += 1) {
    const t = row / segments;
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent).normalize();
    centre.set([point.x, point.y, point.z], row * 3);
    tangents.set([tangent.x, tangent.y, tangent.z], row * 3);

    curve.getTangentAt(clamp01(t + delta), tangentAhead).normalize();
    curve.getTangentAt(clamp01(t - delta), tangentBehind).normalize();
    const turn = (tangentAhead.x - tangentBehind.x) * -tangent.y + (tangentAhead.y - tangentBehind.y) * tangent.x;
    const curvature = turn / Math.max(2 * delta * length, 1e-6);
    roll[row] = MAX_ROLL * Math.tanh(curvature * 1.7);
  }

  // Smoothing prevents hard creases at the spline's control points.
  let source = roll;
  for (let pass = 0; pass < 3; pass += 1) {
    const smoothed = new Float32Array(rows);
    const windowSize = 14;
    for (let row = 0; row < rows; row += 1) {
      let sum = 0;
      let count = 0;
      for (let offset = -windowSize; offset <= windowSize; offset += 1) {
        const index = row + offset;
        if (index >= 0 && index < rows) {
          sum += source[index];
          count += 1;
        }
      }
      smoothed[row] = sum / count;
    }
    source = smoothed;
  }

  const base = new Float32Array(rows * columns * 3);
  const uvs = new Float32Array(rows * columns * 2);
  const indices: number[] = [];
  const faceNormal = new Vector3();
  const across = new Vector3();
  const inPlane = new Vector3();
  const zAxis = new Vector3(0, 0, 1);
  const alongTangent = new Vector3();

  for (let row = 0; row < rows; row += 1) {
    const t = row / segments;
    alongTangent.set(tangents[row * 3], tangents[row * 3 + 1], tangents[row * 3 + 2]);
    inPlane.crossVectors(zAxis, alongTangent).normalize();

    const twist = 0.3 * Math.sin(t * Math.PI * 22 + 0.6) + 0.14 * Math.sin(t * Math.PI * 58 + 1.4);
    const angle = Math.max(-1.32, Math.min(1.32, source[row] + twist));
    faceNormal.copy(zAxis).multiplyScalar(Math.cos(angle)).addScaledVector(inPlane, Math.sin(angle));
    faceNormal.addScaledVector(alongTangent, -faceNormal.dot(alongTangent)).normalize();
    across.crossVectors(alongTangent, faceNormal).normalize();

    for (let column = 0; column < columns; column += 1) {
      const acrossPosition = -1 + (2 * column) / WIDTH_SEGMENTS;
      const cup = 0.1 * width * (acrossPosition * acrossPosition - 0.34);
      const crinkle = 0.011 * Math.sin(t * Math.PI * 76 + acrossPosition * 2.4);
      const lift = cup + crinkle;
      const offset = (row * columns + column) * 3;
      base[offset] = centre[row * 3] + across.x * acrossPosition * half + faceNormal.x * lift;
      base[offset + 1] = centre[row * 3 + 1] + across.y * acrossPosition * half + faceNormal.y * lift;
      base[offset + 2] = centre[row * 3 + 2] + across.z * acrossPosition * half + faceNormal.z * lift;
      uvs[(row * columns + column) * 2] = t;
      uvs[(row * columns + column) * 2 + 1] = (acrossPosition + 1) / 2;
    }

    if (row < segments) {
      for (let column = 0; column < WIDTH_SEGMENTS; column += 1) {
        const a = row * columns + column;
        const b = a + 1;
        const d = a + columns;
        const e = d + 1;
        indices.push(a, d, b, b, d, e);
      }
    }
  }

  const normalSource = new BufferGeometry();
  normalSource.setAttribute("position", new BufferAttribute(base, 3));
  normalSource.setIndex(indices);
  normalSource.computeVertexNormals();
  const baseNormals = (normalSource.getAttribute("normal").array as Float32Array).slice();
  normalSource.dispose();

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(base.length), 3));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array(base.length), 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const pathY = new Float32Array(rows);
  for (let row = 0; row < rows; row += 1) pathY[row] = centre[row * 3 + 1];

  let introIndex = Math.floor(segments * 0.1);
  for (let row = Math.floor(rows * 0.01); row < rows; row += 1) {
    if (pathY[row] <= INTRO_END_Y && row > rows * 0.02) {
      introIndex = row;
      break;
    }
  }

  return {
    geometry,
    segments,
    base,
    baseNormals,
    pathY,
    introIndex,
    notchSegments: (width * 1.1) / (length / segments),
  };
}

/** Reveals the cloth edge-first, leaving a real V-cut rather than a squared-off tip. */
function applyReveal(ribbon: Ribbon, reveal: number) {
  const { geometry, segments, base, baseNormals, notchSegments } = ribbon;
  const columns = WIDTH_SEGMENTS + 1;
  const positions = geometry.getAttribute("position") as BufferAttribute;
  const normals = geometry.getAttribute("normal") as BufferAttribute;
  const positionArray = positions.array as Float32Array;
  const normalArray = normals.array as Float32Array;
  const head = reveal * segments;

  for (let column = 0; column < columns; column += 1) {
    const edge = Math.abs(-1 + (2 * column) / WIDTH_SEGMENTS);
    const limit = Math.max(0, head - notchSegments * (1 - edge));

    for (let row = 0; row <= segments; row += 1) {
      const sample = row < limit ? row : limit;
      const start = Math.floor(sample);
      const blend = sample - start;
      const end = start < segments ? start + 1 : start;
      const startOffset = (start * columns + column) * 3;
      const endOffset = (end * columns + column) * 3;
      const outputOffset = (row * columns + column) * 3;
      positionArray[outputOffset] = base[startOffset] * (1 - blend) + base[endOffset] * blend;
      positionArray[outputOffset + 1] = base[startOffset + 1] * (1 - blend) + base[endOffset + 1] * blend;
      positionArray[outputOffset + 2] = base[startOffset + 2] * (1 - blend) + base[endOffset + 2] * blend;
      normalArray[outputOffset] = baseNormals[startOffset] * (1 - blend) + baseNormals[endOffset] * blend;
      normalArray[outputOffset + 1] = baseNormals[startOffset + 1] * (1 - blend) + baseNormals[endOffset + 1] * blend;
      normalArray[outputOffset + 2] = baseNormals[startOffset + 2] * (1 - blend) + baseNormals[endOffset + 2] * blend;
    }
  }

  positions.needsUpdate = true;
  normals.needsUpdate = true;
}

function segmentForHeight(pathY: Float32Array, height: number) {
  for (let index = 0; index < pathY.length; index += 1) {
    if (pathY[index] <= height) return index;
  }
  return pathY.length - 1;
}

/** Scroll only writes refs; max scroll is cached and updated when the document resizes. */
function useSceneSignals(enablePointer: boolean, freezeAtResult: boolean) {
  const { invalidate } = useThree();
  const progress = useRef(freezeAtResult ? 1 : 0);
  const pointer = useRef(new Vector2());

  useEffect(() => {
    if (freezeAtResult) {
      progress.current = 1;
      invalidate();
      return;
    }

    let maxScroll = 1;
    let renderFrame = 0;
    let introFrame = 0;
    const root = document.documentElement;
    const threadElement = document.querySelector<HTMLElement>(".site-thread");
    let ribbonActive = root.hasAttribute("data-thread-visible") && !threadElement?.classList.contains("is-complete");
    const introStart = performance.now();
    const updateMaxScroll = () => { maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1); };
    const requestRender = () => {
      if (renderFrame || document.hidden) return;
      renderFrame = window.requestAnimationFrame(() => {
        renderFrame = 0;
        progress.current = clamp01(window.scrollY / maxScroll);
        invalidate();
      });
    };
    const playIntro = () => {
      requestRender();
      if (!document.hidden && performance.now() - introStart < 4100) introFrame = window.requestAnimationFrame(playIntro);
    };
    const onResize = () => { updateMaxScroll(); requestRender(); };
    const onPointerMove = (event: PointerEvent) => {
      if (!ribbonActive) return;
      pointer.current.set(event.clientX / window.innerWidth - 0.5, event.clientY / window.innerHeight - 0.5);
      requestRender();
    };
    const onPointerLeave = () => {
      if (!ribbonActive) return;
      pointer.current.set(0, 0);
      requestRender();
    };
    const updateRibbonActivity = () => {
      ribbonActive = root.hasAttribute("data-thread-visible") && !threadElement?.classList.contains("is-complete");
      if (!ribbonActive) pointer.current.set(0, 0);
    };
    const resizeObserver = new ResizeObserver(onResize);
    const rootObserver = new MutationObserver(updateRibbonActivity);
    const threadObserver = threadElement ? new MutationObserver(updateRibbonActivity) : null;

    updateMaxScroll();
    requestRender();
    playIntro();
    resizeObserver.observe(document.documentElement);
    rootObserver.observe(root, { attributes: true, attributeFilter: ["data-thread-visible"] });
    if (threadElement) threadObserver?.observe(threadElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", onResize);
    if (enablePointer) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave);
    }

    return () => {
      resizeObserver.disconnect();
      rootObserver.disconnect();
      threadObserver?.disconnect();
      window.removeEventListener("scroll", requestRender);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      if (renderFrame) window.cancelAnimationFrame(renderFrame);
      if (introFrame) window.cancelAnimationFrame(introFrame);
    };
  }, [enablePointer, freezeAtResult, invalidate]);

  return { progress, pointer };
}

function RibbonJourney({ compact, pointerEnabled, reducedMotion }: { compact: boolean; pointerEnabled: boolean; reducedMotion: boolean }) {
  const segments = compact ? 500 : 900;
  const width = compact ? RIBBON_WIDTH * 0.62 : RIBBON_WIDTH;
  const mesh = useRef<Mesh>(null);
  const lastReveal = useRef(-1);
  const { progress, pointer } = useSceneSignals(pointerEnabled, reducedMotion);
  const ribbon = useMemo(() => {
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    const storyCurve = createStoryCurve(Math.min(1.15, aspect / 1.6));
    return createRibbon(storyCurve, width, segments);
  }, [segments, width]);

  useEffect(() => () => ribbon.geometry.dispose(), [ribbon]);

  useFrame((state) => {
    const currentProgress = reducedMotion ? 1 : progress.current;
    const introTarget = ribbon.introIndex / ribbon.segments;
    const intro = reducedMotion ? 1 : easeOutCubic(clamp01((state.clock.elapsedTime - 0.35) / 3.6));
    const introReveal = introTarget * intro;
    const targetY = CAMERA_START_Y - currentProgress * CAMERA_TRAVEL;
    const tipSegment = segmentForHeight(ribbon.pathY, targetY - HEAD_LEAD);
    const finish = clamp01((currentProgress - 0.965) / 0.035);
    const reveal = reducedMotion ? 1 : Math.max(introReveal, tipSegment / ribbon.segments, finish);

    if (mesh.current) mesh.current.visible = reveal > 0.002;
    if (Math.abs(reveal - lastReveal.current) > 0.0005) {
      applyReveal(ribbon, reveal);
      lastReveal.current = reveal;
    }

    const pointerX = pointerEnabled ? pointer.current.x * 0.22 : 0;
    const pointerY = pointerEnabled ? pointer.current.y * 0.12 : 0;
    const targetX = compact || reducedMotion ? 0.78 : Math.sin(currentProgress * Math.PI * 5) * 0.12 + pointerX;
    state.camera.position.x += (targetX - state.camera.position.x) * 0.1;
    state.camera.position.y += (targetY + pointerY - state.camera.position.y) * 0.1;
    state.camera.lookAt(targetX, state.camera.position.y, 0);
  });

  return <mesh ref={mesh} geometry={ribbon.geometry} frustumCulled={false} visible={false}><meshPhysicalMaterial {...silkMaterial} /></mesh>;
}

export default function SiteThreadScene() {
  const [mounted, setMounted] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(false);
  const { compact, reducedMotion, finePointer } = useScenePreferences();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setWebglAvailable(getWebGLSupport());
      setMounted(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!mounted || !webglAvailable) return <RibbonFallback />;

  return (
    <Canvas
      className="thread-canvas"
      flat
      dpr={compact ? [1, 1.25] : [1, 1.75]}
      frameloop="demand"
      camera={{ position: [0, CAMERA_START_Y, 7.2], fov: 38 }}
      gl={{ alpha: true, antialias: !compact, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.15} />
      <hemisphereLight args={["#ffe9e0", "#3a0409", 0.55]} />
      <directionalLight position={[4, 5, 6]} intensity={2.2} color="#fff1e8" />
      <pointLight position={[-3, 1, 3]} intensity={7} color="#ff3a4b" distance={9} />
      <RibbonJourney compact={compact} pointerEnabled={!compact && !reducedMotion && finePointer} reducedMotion={reducedMotion} />
      <Environment preset="studio" />
    </Canvas>
  );
}
