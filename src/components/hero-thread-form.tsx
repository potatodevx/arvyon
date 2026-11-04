"use client";

import { Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { type MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import {
  BufferAttribute,
  CatmullRomCurve3,
  Group,
  MeshPhysicalMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const DESKTOP_THREADS = 170;
const MOBILE_THREADS = 110;
const TUBULAR_SEGMENTS = 200;
const THREAD_RADIUS = 0.0065;
const CYCLE_SECONDS = 16;

type HeroThreadFormProps = {
  threads?: number;
  mobileThreads?: number;
};

function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function knotPoint(t: number, target: Vector3) {
  const p = 2;
  const q = 3;
  const angle = t * Math.PI * 2;
  const radius = 1 + 0.42 * Math.cos(q * angle);
  return target.set(radius * Math.cos(p * angle), radius * Math.sin(p * angle), 0.55 * Math.sin(q * angle));
}

/** Merges the silk threads into one draw call while retaining each thread's scatter direction. */
function buildThreadGeometry(threadCount: number) {
  const random = seeded(7);
  const base = new CatmullRomCurve3(
    Array.from({ length: 160 }, (_, index) => knotPoint(index / 160, new Vector3())),
    true,
  );
  const frames = base.computeFrenetFrames(TUBULAR_SEGMENTS, true);
  const centre = new Vector3();
  const geometries: TubeGeometry[] = [];

  for (let thread = 0; thread < threadCount; thread += 1) {
    const phase = random() * Math.PI * 2;
    const radius = 0.05 + Math.pow(random(), 0.8) * 0.2;
    const turns = 2 + Math.floor(random() * 3);
    const direction = random() > 0.5 ? 1 : -1;
    const points: Vector3[] = [];

    for (let index = 0; index < TUBULAR_SEGMENTS; index += 1) {
      const t = index / TUBULAR_SEGMENTS;
      base.getPointAt(t, centre);
      const angle = phase + direction * turns * Math.PI * 2 * t;
      const normal = frames.normals[index];
      const binormal = frames.binormals[index];
      points.push(new Vector3(
        centre.x + (normal.x * Math.cos(angle) + binormal.x * Math.sin(angle)) * radius,
        centre.y + (normal.y * Math.cos(angle) + binormal.y * Math.sin(angle)) * radius,
        centre.z + (normal.z * Math.cos(angle) + binormal.z * Math.sin(angle)) * radius,
      ));
    }

    const tube = new TubeGeometry(new CatmullRomCurve3(points, true), TUBULAR_SEGMENTS, THREAD_RADIUS, 3, true);
    const scatter = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize().multiplyScalar(1.2 + random() * 1.6);
    const count = tube.getAttribute("position").count;
    const scatterAttribute = new Float32Array(count * 3);
    for (let vertex = 0; vertex < count; vertex += 1) scatter.toArray(scatterAttribute, vertex * 3);
    tube.setAttribute("aScatter", new BufferAttribute(scatterAttribute, 3));
    tube.deleteAttribute("uv");
    geometries.push(tube);
  }

  const merged = mergeGeometries(geometries, false);
  geometries.forEach((geometry) => geometry.dispose());
  if (!merged) throw new Error("Unable to merge the hero thread geometry.");
  return merged;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function ThreadForm({ reduced, threads, scroll }: {
  reduced: boolean;
  threads: number;
  scroll: MutableRefObject<number>;
}) {
  const group = useRef<Group>(null);
  const geometry = useMemo(() => buildThreadGeometry(threads), [threads]);
  const uniforms = useRef({ uMix: { value: 0 }, uTime: { value: 0 } });
  const material = useMemo(() => {
    const silk = new MeshPhysicalMaterial({
      color: "#b01227",
      emissive: "#2a0208",
      emissiveIntensity: 0.12,
      roughness: 0.34,
      metalness: 0.05,
      sheen: 1,
      sheenColor: "#ff4a5c",
      sheenRoughness: 0.4,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.1,
    });

    silk.onBeforeCompile = (shader) => {
      shader.uniforms.uMix = uniforms.current.uMix;
      shader.uniforms.uTime = uniforms.current.uTime;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nattribute vec3 aScatter;\nuniform float uMix;\nuniform float uTime;",
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          float loose = 1.0 - uMix;
          vec3 wobble = vec3(
            sin(position.y * 2.2 + uTime * 0.7 + aScatter.x * 3.0),
            cos(position.x * 2.2 + uTime * 0.6 + aScatter.y * 3.0),
            sin(position.z * 2.2 + uTime * 0.5 + aScatter.z * 3.0)
          ) * 0.22;
          transformed = transformed * (1.0 + loose * 1.35) + (aScatter + wobble) * loose;`,
        );
    };
    return silk;
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const form = group.current;
    if (!form) return;

    if (reduced) {
      uniforms.current.uMix.value = 1;
      uniforms.current.uTime.value = 0;
    } else {
      uniforms.current.uTime.value += delta;
      const phase = (state.clock.elapsedTime % CYCLE_SECONDS) / CYCLE_SECONDS;
      const wave = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
      uniforms.current.uMix.value = smoothstep(0.12, 0.72, wave);
    }

    const wide = state.viewport.width > 7;
    const targetX = wide ? state.viewport.width * 0.2 : 0;
    const scrollOffset = Math.min(Math.max(scroll.current, 0), 1);
    form.position.x += (targetX - form.position.x) * 0.08;
    form.position.y += (0.1 - scrollOffset * 0.5 - form.position.y) * 0.08;

    const tiltX = reduced ? 0 : state.pointer.y * -0.22;
    const tiltY = reduced ? 0 : state.pointer.x * 0.35;
    const idle = reduced ? 0 : state.clock.elapsedTime * 0.07;
    form.rotation.x += (0.35 + tiltX - form.rotation.x) * 0.05;
    form.rotation.y += (idle + scrollOffset * 0.9 + tiltY - form.rotation.y) * 0.05;
    form.rotation.z = 0.15;
  });

  return <group ref={group} scale={1.55}><mesh geometry={geometry} material={material} frustumCulled={false} /></group>;
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function HeroThreadForm({ threads = DESKTOP_THREADS, mobileThreads = MOBILE_THREADS }: HeroThreadFormProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const scroll = useRef(0);
  const [active, setActive] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [compact, setCompact] = useState(true);
  const [webglAvailable, setWebglAvailable] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactQuery = window.matchMedia("(max-width: 699px)");
    const sync = () => {
      setReduced(motion.matches);
      setCompact(compactQuery.matches);
    };
    const onVisibilityChange = () => setTabVisible(!document.hidden);
    const updateScroll = () => { scroll.current = window.scrollY / Math.max(window.innerHeight, 1); };
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: 0 });
    const frame = window.requestAnimationFrame(() => setWebglAvailable(supportsWebGL()));

    sync();
    onVisibilityChange();
    updateScroll();
    motion.addEventListener("change", sync);
    compactQuery.addEventListener("change", sync);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("scroll", updateScroll, { passive: true });
    if (wrapper.current) observer.observe(wrapper.current);

    return () => {
      window.cancelAnimationFrame(frame);
      motion.removeEventListener("change", sync);
      compactQuery.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("scroll", updateScroll);
      observer.disconnect();
    };
  }, []);

  if (!webglAvailable) return <div ref={wrapper} className="hero-form hero-form-fallback" aria-hidden="true" />;

  const frameLoop = active && tabVisible ? (reduced ? "demand" : "always") : "never";
  return (
    <div ref={wrapper} className="hero-form" aria-hidden="true">
      <Canvas
        frameloop={frameLoop}
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 7], fov: 38 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        flat
        eventSource={document.body}
        eventPrefix="client"
      >
        <ambientLight intensity={0.18} />
        <hemisphereLight args={["#ffe9e0", "#3a0409", 0.5]} />
        <directionalLight position={[4, 5, 6]} intensity={2} color="#fff1e8" />
        <pointLight position={[-3, 1, 3]} intensity={6} color="#ff3a4b" distance={9} />
        <ThreadForm reduced={reduced} threads={compact ? mobileThreads : threads} scroll={scroll} />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}
