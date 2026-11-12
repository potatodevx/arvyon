"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

export type RotatingTextProps = {
  texts: string[];
  effect?: "slide" | "flip" | "blur" | "scale" | "drop";
  direction?: "up" | "down";
  highlight?: boolean;
  highlightColor?: string;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  staggerDuration?: number;
  splitLevelClassName?: string;
  rotationInterval?: number;
  splitBy?: "characters" | "words" | "lines" | string;
  blur?: number;
  auto?: boolean;
  loop?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  style?: CSSProperties;
};

const segment = (text: string) => {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text), ({ segment: character }) => character);
  }
  return Array.from(text);
};

export default function RotatingText({
  texts,
  effect = "slide",
  direction = "up",
  highlight = false,
  highlightColor = "#941f31",
  staggerFrom = "first",
  staggerDuration = 0.025,
  splitLevelClassName = "",
  rotationInterval = 2000,
  splitBy = "characters",
  blur = 0,
  auto = true,
  loop = true,
  pauseOnHover = false,
  className = "",
  style,
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const current = texts[index] ?? "";
  const pieces = useMemo(() => {
    if (splitBy === "words") return current.split(/(\s+)/).filter(Boolean);
    if (splitBy === "lines") return current.split("\n");
    return splitBy === "characters" ? segment(current) : current.split(splitBy);
  }, [current, splitBy]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!auto || paused || reduced || texts.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value < texts.length - 1 ? value + 1 : loop ? 0 : value)), rotationInterval);
    return () => window.clearInterval(timer);
  }, [auto, loop, paused, reduced, rotationInterval, texts.length]);

  const orderFor = (position: number) => {
    if (typeof staggerFrom === "number") return Math.abs(staggerFrom - position);
    if (staggerFrom === "last") return pieces.length - 1 - position;
    if (staggerFrom === "center") return Math.abs((pieces.length - 1) / 2 - position);
    if (staggerFrom === "random") return (position * 7) % Math.max(pieces.length, 1);
    return position;
  };
  const animationStyle = { ...style, "--rotate-highlight": highlightColor, "--rotate-blur": `${blur}px` } as CSSProperties;

  return (
    <span
      className={`text-rotate${highlight ? " text-rotate-highlight" : ""} ${className}`.trim()}
      style={animationStyle}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <span className="text-rotate-sr-only" aria-live="polite">{current}</span>
      <span className="text-rotate-highlight-content" aria-hidden="true" key={index}>
        {pieces.map((piece, pieceIndex) => (
          <span
            className={`text-rotate-word ${splitLevelClassName}`.trim()}
            key={`${piece}-${pieceIndex}`}
            style={{ "--rotate-delay": `${orderFor(pieceIndex) * staggerDuration}s` } as CSSProperties}
          >
            <span className={`text-rotate-element text-rotate-${effect} text-rotate-${direction}`}>
              {piece === " " ? <span className="text-rotate-space"> </span> : piece}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
