"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "xyz-hero-intro-seen";

export function HeroPreloader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dispose = 0;

    const reveal = () => {
      root.dataset.heroReady = "true";
      setLeaving(true);
      dispose = window.setTimeout(() => setVisible(false), 260);
    };

    if (reducedMotion || sessionStorage.getItem(STORAGE_KEY)) {
      reveal();
      return () => window.clearTimeout(dispose);
    }

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "true");
      reveal();
    }, 1200);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(dispose);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`hero-preloader${leaving ? " is-leaving" : ""}`} aria-hidden="true">
      <span className="hero-preloader-mark">XYZ</span>
      <span className="hero-preloader-line" />
    </div>
  );
}
