"use client";

import { useEffect, useRef, type CSSProperties } from "react";

export type ParticleTextProps = {
  text?: string;
  particleSize?: number;
  density?: number;
  color?: string;
  highlightColor?: string;
  highlightMode?: "motion" | "gradient";
  shape?: "circle" | "square" | "line";
  intro?: "gather" | "rain" | "spiral" | "scan";
  scatter?: number;
  gatherDuration?: number;
  stagger?: number;
  clickBurst?: boolean;
  burstStrength?: number;
  pointerRepel?: number;
  repelRadius?: number;
  idleDrift?: number;
  trigger?: "mount" | "hover" | "click";
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
};

type Particle = {
  x: number; y: number; startX: number; startY: number; targetX: number; targetY: number;
  ox: number; oy: number; vx: number; vy: number; seed: number; angle: number;
};

const clamp = (value: number, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const easeOut = (value: number) => 1 - Math.pow(1 - value, 3);

function resolveColor(element: HTMLElement, value: string) {
  return /^(currentcolor|inherit)$/i.test(value) ? window.getComputedStyle(element).color : value;
}

function resolveFontSize(value: number | string, element: HTMLElement, weight: number | string, family: string) {
  if (typeof value === "number") return value;
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;font:${weight} ${value} ${family};`;
  probe.textContent = "M";
  element.appendChild(probe);
  const size = Number.parseFloat(window.getComputedStyle(probe).fontSize) || 96;
  probe.remove();
  return size;
}

export default function ParticleText({
  text = "Future Interfaces",
  particleSize = 2.2,
  density = 4,
  color = "currentColor",
  highlightColor = "#ff5a36",
  highlightMode = "motion",
  shape = "circle",
  intro = "gather",
  scatter = 190,
  gatherDuration = 1600,
  stagger = 420,
  clickBurst = true,
  burstStrength = 1,
  pointerRepel = 42,
  repelRadius = 120,
  idleDrift = 0.8,
  trigger = "mount",
  fontSize = "clamp(3.5rem, 13vw, 9rem)",
  fontWeight = 800,
  fontFamily = "inherit",
  glow = true,
  className = "",
  style,
}: ParticleTextProps) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const settings = useRef({ text, particleSize, density, color, highlightColor, highlightMode, shape, intro, scatter, gatherDuration, stagger, clickBurst, burstStrength, pointerRepel, repelRadius, idleDrift, trigger, fontSize, fontWeight, fontFamily, glow });

  useEffect(() => {
    settings.current = { text, particleSize, density, color, highlightColor, highlightMode, shape, intro, scatter, gatherDuration, stagger, clickBurst, burstStrength, pointerRepel, repelRadius, idleDrift, trigger, fontSize, fontWeight, fontFamily, glow };
  });

  useEffect(() => {
    const host = container.current;
    const target = canvas.current;
    const context = target?.getContext("2d");
    if (!host || !target || !context) return undefined;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let introStarted = 0;
    let pointer = { active: false, x: 0, y: 0 };
    let visible = true;
    let pageVisible = !document.hidden;
    let reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let alive = true;
    let built = 0;
    let requestId = 0;

    const resize = async (restart = false) => {
      const config = settings.current;
      const rect = host.getBoundingClientRect();
      const nextWidth = Math.floor(rect.width);
      const nextHeight = Math.floor(rect.height);
      const id = ++built;
      if (!nextWidth || !nextHeight) return;

      const family = config.fontFamily === "inherit" ? window.getComputedStyle(host).fontFamily : config.fontFamily;
      let size = resolveFontSize(config.fontSize, host, config.fontWeight, family);
      if ("fonts" in document) await document.fonts.ready;
      if (!alive || id !== built) return;

      const sampler = document.createElement("canvas");
      const sample = sampler.getContext("2d", { willReadFrequently: true });
      if (!sample) return;
      let font = `${config.fontWeight} ${size}px ${family}`;
      sample.font = font;
      let metrics = sample.measureText(config.text || " ");
      if (metrics.width > nextWidth * 0.92) {
        size = Math.max(18, size * ((nextWidth * 0.92) / metrics.width));
        font = `${config.fontWeight} ${size}px ${family}`;
        sample.font = font;
        metrics = sample.measureText(config.text || " ");
      }
      const ascent = Math.ceil(metrics.actualBoundingBoxAscent || size * 0.76);
      const descent = Math.ceil(metrics.actualBoundingBoxDescent || size * 0.24);
      const textWidth = Math.ceil(metrics.width);
      const padding = Math.ceil(size * 0.1) + 8;
      sampler.width = textWidth + padding * 2;
      sampler.height = ascent + descent + padding * 2;
      sample.font = font;
      sample.fillStyle = "#fff";
      sample.textBaseline = "alphabetic";
      sample.fillText(config.text || " ", padding, padding + ascent);

      const pixels = sample.getImageData(0, 0, sampler.width, sampler.height).data;
      const candidates: Array<{ x: number; y: number }> = [];
      const step = Math.max(2, Math.floor(config.density));
      for (let y = 0; y < sampler.height; y += step) for (let x = 0; x < sampler.width; x += step) {
        if (pixels[(y * sampler.width + x) * 4 + 3] > 55) candidates.push({ x, y });
      }
      const particleBudget = nextWidth < 700 ? 1300 : 2200;
      const maximum = Math.max(650, Math.min(particleBudget, Math.floor((nextWidth * nextHeight) / 150)));
      const stride = Math.max(1, Math.ceil(candidates.length / maximum));
      const selected = candidates.filter((_, index) => index % stride === 0);
      const xOffset = nextWidth / 2 - sampler.width / 2;
      const yOffset = nextHeight / 2 - sampler.height / 2;

      width = nextWidth;
      height = nextHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      target.width = Math.max(1, Math.floor(width * dpr));
      target.height = Math.max(1, Math.floor(height * dpr));
      particles = selected.map((candidate, index) => {
        const seed = ((index * 9301 + 49297) % 233280) / 233280;
        const targetX = xOffset + candidate.x;
        const targetY = yOffset + candidate.y;
        const angle = seed * Math.PI * 2;
        const distance = config.scatter * (0.34 + ((index * 73) % 100) / 100 * 0.72);
        let startX = targetX + Math.cos(angle) * distance;
        let startY = targetY + Math.sin(angle) * distance;
        if (config.intro === "rain") { startX = targetX + (seed - 0.5) * 50; startY = -40 - seed * height * 0.55; }
        if (config.intro === "spiral") { startX = width / 2 + Math.cos(angle + 2.8) * (distance + 50); startY = height / 2 + Math.sin(angle + 2.8) * (distance + 50); }
        if (config.intro === "scan") { startX = -25 - seed * 60; startY = targetY + (seed - 0.5) * 42; }
        return { x: reduced ? targetX : startX, y: reduced ? targetY : startY, startX, startY, targetX, targetY, ox: 0, oy: 0, vx: 0, vy: 0, seed, angle };
      });
      introStarted = reduced || (!restart && config.trigger !== "mount") ? -1 : performance.now();
      pointer = { active: false, x: width / 2, y: height / 2 };
      draw(performance.now());
    };

    const drawParticle = (particle: Particle, config: typeof settings.current, moving: number, baseColor: string, accentColor: string) => {
      const radius = Math.max(0.6, config.particleSize * (0.82 + particle.seed * 0.45));
      const accent = config.highlightMode === "motion" && moving > 0.1;
      context.fillStyle = accent ? accentColor : baseColor;
      if (config.shape === "line") {
        context.strokeStyle = context.fillStyle;
        context.lineWidth = Math.max(1, radius * 0.6);
        context.beginPath();
        context.moveTo(particle.x - Math.cos(particle.angle) * radius * 1.8, particle.y - Math.sin(particle.angle) * radius * 1.8);
        context.lineTo(particle.x + Math.cos(particle.angle) * radius * 1.8, particle.y + Math.sin(particle.angle) * radius * 1.8);
        context.stroke();
      } else if (config.shape === "square" || radius <= 1.4) {
        context.fillRect(particle.x - radius / 2, particle.y - radius / 2, radius, radius);
      } else {
        context.beginPath();
        context.arc(particle.x, particle.y, radius / 2, 0, Math.PI * 2);
        context.fill();
      }
    };

    const draw = (now: number) => {
      const config = settings.current;
      if (!width || !height) return false;
      const elapsed = introStarted > 0 ? now - introStarted : config.gatherDuration + config.stagger;
      const introActive = introStarted > 0 && elapsed < config.gatherDuration + config.stagger;
      const baseColor = resolveColor(host, config.color);
      const accentColor = resolveColor(host, config.highlightColor);
      let kinetic = false;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      if (config.glow) { context.shadowColor = accentColor; context.shadowBlur = 7; }

      for (const particle of particles) {
        const delay = particle.seed * config.stagger;
        const progress = reduced ? 1 : clamp((elapsed - delay) / Math.max(1, config.gatherDuration));
        const eased = easeOut(progress);
        let targetX = particle.targetX + particle.ox;
        let targetY = particle.targetY + particle.oy;
        if (introStarted > 0 && progress < 1) {
          targetX = particle.startX + (particle.targetX - particle.startX) * eased + particle.ox;
          targetY = particle.startY + (particle.targetY - particle.startY) * eased + particle.oy;
        } else if (!reduced && config.idleDrift > 0) {
          targetX += Math.sin(now * 0.00075 + particle.seed * 18) * config.idleDrift;
          targetY += Math.cos(now * 0.00063 + particle.seed * 14) * config.idleDrift;
        }
        if (!reduced && pointer.active) {
          const dx = targetX - pointer.x;
          const dy = targetY - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance && distance < config.repelRadius) {
            const force = Math.pow(1 - distance / config.repelRadius, 2) * config.pointerRepel;
            targetX += (dx / distance) * force;
            targetY += (dy / distance) * force;
          }
        }
        particle.vx += (targetX - particle.x) * 0.13;
        particle.vy += (targetY - particle.y) * 0.13;
        particle.vx *= 0.72;
        particle.vy *= 0.72;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.ox *= 0.91;
        particle.oy *= 0.91;
        particle.angle = Math.atan2(particle.vy, particle.vx) || particle.angle;
        const velocity = Math.hypot(particle.vx, particle.vy);
        kinetic ||= velocity > 0.06 || Math.abs(particle.ox) > 0.06 || Math.abs(particle.oy) > 0.06;
        drawParticle(particle, config, velocity, baseColor, accentColor);
      }
      context.shadowBlur = 0;
      return !reduced && (introActive || pointer.active || kinetic || config.idleDrift > 0);
    };

    const tick = (now: number) => {
      raf = 0;
      if (!alive || !visible || !pageVisible) return;
      if (draw(now)) raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!raf && alive && visible && pageVisible) raf = requestAnimationFrame(tick); };
    const rerender = () => { if (requestId) cancelAnimationFrame(requestId); requestId = requestAnimationFrame(() => { requestId = 0; void resize(true); }); };
    const locate = (event: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      pointer = { active: true, x: event.clientX - rect.left, y: event.clientY - rect.top };
      wake();
    };
    const leave = () => { pointer.active = false; wake(); };
    const burst = (event: PointerEvent) => {
      const config = settings.current;
      if (reduced || !config.clickBurst) return;
      locate(event);
      for (const particle of particles) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        if (distance > config.repelRadius * 1.15) continue;
        const force = (1 - distance / (config.repelRadius * 1.15)) * config.burstStrength * 19;
        particle.ox += (dx / distance) * force;
        particle.oy += (dy / distance) * force;
      }
      wake();
    };
    const startOnHover = () => { if (settings.current.trigger === "hover") { introStarted = performance.now(); wake(); } };
    const startOnClick = () => { if (settings.current.trigger === "click") { introStarted = performance.now(); wake(); } };
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => { reduced = motion.matches; void resize(false); };
    const onVisibility = () => { pageVisible = !document.hidden; wake(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); }, { threshold: 0.01 });
    const resizeObserver = new ResizeObserver(rerender);

    observer.observe(host);
    resizeObserver.observe(host);
    target.addEventListener("pointerenter", startOnHover);
    target.addEventListener("pointermove", locate);
    target.addEventListener("pointerleave", leave);
    target.addEventListener("pointerdown", burst);
    target.addEventListener("click", startOnClick);
    motion.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibility);
    void resize(false).then(wake);

    return () => {
      alive = false;
      observer.disconnect();
      resizeObserver.disconnect();
      target.removeEventListener("pointerenter", startOnHover);
      target.removeEventListener("pointermove", locate);
      target.removeEventListener("pointerleave", leave);
      target.removeEventListener("pointerdown", burst);
      target.removeEventListener("click", startOnClick);
      motion.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
      if (raf) cancelAnimationFrame(raf);
      if (requestId) cancelAnimationFrame(requestId);
    };
  }, []);

  return (
    <div ref={container} className={`particle-text ${className}`.trim()} style={style}>
      <canvas ref={canvas} className="particle-text__canvas" aria-hidden="true" />
      <span className="particle-text__sr">{text}</span>
    </div>
  );
}
