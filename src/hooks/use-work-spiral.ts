"use client";

import { useEffect } from "react";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Drives three portfolio cards around an invisible centre without React scroll renders. */
export function useWorkSpiral() {
  useEffect(() => {
    const list = document.querySelector<HTMLElement>("[data-work-spiral]");
    const section = list?.closest<HTMLElement>(".work-section");
    if (!list || !section) return undefined;
    const cards = Array.from(list.querySelectorAll<HTMLElement>(".project-card"));
    const desktop = window.matchMedia("(min-width: 800px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let inView = false;

    const reset = () => {
      list.classList.remove("is-orbital");
      section.classList.remove("is-orbital-section");
      cards.forEach((card) => {
        card.style.removeProperty("transform");
        card.style.removeProperty("opacity");
        card.style.removeProperty("z-index");
        card.style.removeProperty("pointer-events");
        card.inert = false;
      });
    };

    const paint = () => {
      frame = 0;
      if (!inView || !desktop.matches || reduced.matches) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      const progress = clamp(-rect.top / travel);
      const sequence = 0.1 + progress * cards.length;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const radiusX = Math.min(width * 0.28, 390);

      cards.forEach((card, index) => {
        const local = clamp(sequence - index);
        const entry = clamp(local / 0.17);
        const exit = 1 - clamp((local - 0.78) / 0.22);
        const opacity = Math.min(entry, exit);
        const angle = 2.1 - local * 4.2 + index * 0.12;
        const x = Math.sin(angle) * radiusX;
        const y = (0.63 - local * 1.27) * height + Math.cos(angle) * height * 0.065;
        const rotation = (0.5 - local) * 16;
        const scale = 0.78 + Math.sin(local * Math.PI) * 0.22;
        card.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0) rotate(${rotation.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = String(20 + Math.round((1 - local) * 10));
        card.style.pointerEvents = opacity > 0.22 ? "auto" : "none";
        card.inert = opacity <= 0.22;
      });
    };
    const requestPaint = () => { if (!frame) frame = window.requestAnimationFrame(paint); };
    const update = () => {
      if (!desktop.matches || reduced.matches) { reset(); return; }
      list.classList.add("is-orbital");
      section.classList.add("is-orbital-section");
      requestPaint();
    };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; if (inView) update(); }, { threshold: 0 });
    const resizeObserver = new ResizeObserver(update);

    observer.observe(section);
    resizeObserver.observe(section);
    desktop.addEventListener("change", update);
    reduced.addEventListener("change", update);
    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      desktop.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
      window.removeEventListener("scroll", requestPaint);
      window.removeEventListener("resize", update);
      if (frame) window.cancelAnimationFrame(frame);
      reset();
    };
  }, []);
}
