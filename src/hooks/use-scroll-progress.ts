"use client";

import { useEffect } from "react";

/**
 * Keeps visual scroll state in CSS rather than React render state. The header attributes
 * are also updated here so the navigation can react to scroll direction without rerendering.
 */
export function useScrollProgress() {
  useEffect(() => {
    const root = document.documentElement;
    let animationFrame = 0;
    let previousY = window.scrollY;
    let maxScroll = 1;
    let threadRevealStart = window.innerHeight * 0.55;

    const updateMaxScroll = () => {
      maxScroll = Math.max(root.scrollHeight - window.innerHeight, 1);
      const hero = document.getElementById("top");
      threadRevealStart = (hero?.offsetHeight ?? window.innerHeight) * 0.55;
    };

    const update = () => {
      animationFrame = 0;
      const currentY = window.scrollY;
      root.style.setProperty("--scroll-progress", `${Math.min(1, Math.max(0, currentY / maxScroll))}`);

      root.toggleAttribute("data-header-frosted", currentY > window.innerHeight * 0.45);
      root.toggleAttribute("data-header-hidden", currentY > 120 && currentY > previousY + 2);
      root.toggleAttribute("data-thread-visible", currentY >= threadRevealStart);
      previousY = currentY;
    };

    const requestUpdate = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(update);
    };

    const onResize = () => {
      updateMaxScroll();
      requestUpdate();
    };
    const resizeObserver = new ResizeObserver(onResize);

    updateMaxScroll();
    requestUpdate();
    resizeObserver.observe(root);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", onResize);
      resizeObserver.disconnect();
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      root.style.removeProperty("--scroll-progress");
      root.removeAttribute("data-header-frosted");
      root.removeAttribute("data-header-hidden");
      root.removeAttribute("data-thread-visible");
    };
  }, []);
}
