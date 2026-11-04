"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { type ShaderMaterial, Vector2 } from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + 11.7;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 point = vUv - 0.5;
    point.x *= uResolution.x / max(uResolution.y, 1.0);
    vec2 pointer = uPointer - 0.5;
    pointer.x *= uResolution.x / max(uResolution.y, 1.0);

    float time = uTime * 0.16;
    float fold = sin(point.x * 5.2 + point.y * 2.4 + time + sin(point.y * 7.0 - time) * 0.6);
    float grain = fbm(point * 3.0 + vec2(time * 0.35, -time * 0.18));
    float cursor = exp(-7.5 * distance(point, pointer));
    float silk = smoothstep(-1.15, 1.25, fold + (grain - 0.5) * 1.1 + cursor * 0.72);
    float red = smoothstep(0.57, 1.04, silk + cursor * 0.21);

    vec3 paper = vec3(0.956, 0.929, 0.890);
    vec3 blush = vec3(0.914, 0.646, 0.630);
    vec3 oxblood = vec3(0.580, 0.122, 0.192);
    vec3 color = mix(paper, blush, smoothstep(0.14, 0.76, silk) * 0.72);
    color = mix(color, oxblood, red * 0.62);
    color += (grain - 0.5) * 0.055;

    gl_FragColor = vec4(color, 0.78);
  }
`;

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function SilkPlane({ pointerEnabled, frozen }: { pointerEnabled: boolean; frozen: boolean }) {
  const pointer = useRef(new Vector2(0.55, 0.42));
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPointer: { value: new Vector2(0.55, 0.42) },
    uResolution: { value: new Vector2(1, 1) },
  }), []);

  useEffect(() => {
    if (!pointerEnabled) return;
    const onPointerMove = (event: PointerEvent) => {
      pointer.current.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [pointerEnabled]);

  useFrame(({ clock, size }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = frozen ? 0 : clock.elapsedTime;
    material.current.uniforms.uResolution.value.set(size.width, size.height);
    material.current.uniforms.uPointer.value.lerp(pointer.current, 0.075);
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}

export default function HeroSilkField() {
  const field = useRef<HTMLDivElement>(null);
  const [webglAvailable, setWebglAvailable] = useState(false);
  const [compact, setCompact] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const compactQuery = window.matchMedia("(max-width: 699px)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: fine)");
    const update = () => {
      setCompact(compactQuery.matches);
      setReducedMotion(motionQuery.matches);
      setFinePointer(pointerQuery.matches);
    };
    const frame = window.requestAnimationFrame(() => setWebglAvailable(supportsWebGL()));
    const onVisibilityChange = () => setTabVisible(!document.hidden);

    update();
    onVisibilityChange();
    compactQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);
    pointerQuery.addEventListener("change", update);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.cancelAnimationFrame(frame);
      compactQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
      pointerQuery.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const target = field.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.02 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const useCanvas = webglAvailable && !compact;
  const renderActive = useCanvas && inView && tabVisible && !reducedMotion;
  const frameLoop = renderActive ? "always" : useCanvas && inView && tabVisible ? "demand" : "never";

  return (
    <div ref={field} className="hero-field" aria-hidden="true">
      {useCanvas ? (
        <Canvas
          dpr={[1, 1.5]}
          frameloop={frameLoop}
          gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        >
          <SilkPlane pointerEnabled={finePointer && renderActive} frozen={reducedMotion} />
        </Canvas>
      ) : <div className="hero-field-fallback" />}
    </div>
  );
}
