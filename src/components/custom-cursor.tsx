"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const cursor = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLSpanElement>(null);
  const ring = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)");
    if (!media.matches) return;

    document.documentElement.classList.add("has-custom-cursor");
    let frame = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    const draw = () => {
      frame = 0;
      ringX += (targetX - ringX) * 0.16;
      ringY += (targetY - ringY) * 0.16;
      dot.current?.style.setProperty("transform", `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`);
      ring.current?.style.setProperty("transform", `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`);
      if (Math.abs(targetX - ringX) > 0.15 || Math.abs(targetY - ringY) > 0.15) frame = window.requestAnimationFrame(draw);
    };
    const requestDraw = () => {
      if (!frame) frame = window.requestAnimationFrame(draw);
    };
    const onPointerMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.current?.classList.add("is-visible");
      const target = event.target instanceof Element ? event.target : null;
      cursor.current?.classList.toggle("is-active", Boolean(target?.closest("a, button, summary, [role='button']")));
      requestDraw();
    };
    const onPointerLeave = () => cursor.current?.classList.remove("is-visible", "is-active");

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      document.documentElement.classList.remove("has-custom-cursor");
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="custom-cursor" ref={cursor} aria-hidden="true"><span ref={dot} /><span ref={ring} /></div>;
}
