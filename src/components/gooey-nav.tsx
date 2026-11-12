"use client";

import {
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export type GooeyNavItem = {
  label: string;
  href: string;
  icon?: ReactNode;
};

type GooeyNavProps = {
  items: GooeyNavItem[];
  initialActiveIndex?: number;
  activeIndex?: number;
  onChange?: (index: number, item: GooeyNavItem) => void;
  theme?: "light" | "dark";
  color?: string;
  activeTextColor?: string;
  size?: "sm" | "md" | "lg";
  frame?: boolean;
  particleCount?: number;
  spread?: number;
  animationTime?: number;
  timeVariance?: number;
  gooeyness?: number;
  wobble?: number;
  hoverEffect?: boolean;
  className?: string;
  style?: CSSProperties;
};

type PillRect = { x: number; y: number; width: number; height: number };

const themes = {
  light: {
    "--gn-frame": "rgba(244, 237, 227, .74)",
    "--gn-frame-edge": "rgba(76, 43, 36, .18)",
    "--gn-frame-highlight": "rgba(255, 255, 255, .92)",
    "--gn-frame-shadow": "0 16px 36px -22px rgba(66, 32, 27, .35), 0 5px 15px -10px rgba(66, 32, 27, .18)",
    "--gn-ink": "#281d1b",
    "--gn-muted": "rgba(40, 29, 27, .66)",
  },
  dark: {
    "--gn-frame": "rgba(40, 29, 27, .74)",
    "--gn-frame-edge": "rgba(255, 255, 255, .1)",
    "--gn-frame-highlight": "rgba(255, 255, 255, .1)",
    "--gn-frame-shadow": "0 16px 36px -22px rgba(0, 0, 0, .75)",
    "--gn-ink": "#f4ede3",
    "--gn-muted": "rgba(244, 237, 227, .68)",
  },
} as const;

export default function GooeyNav({
  items,
  initialActiveIndex = 0,
  activeIndex,
  onChange,
  theme = "light",
  color = "#941f31",
  activeTextColor = "#f4ede3",
  size = "md",
  frame = true,
  particleCount = 15,
  spread = 56,
  animationTime = 600,
  timeVariance = 300,
  gooeyness = 0.5,
  wobble = 0.5,
  hoverEffect = true,
  className = "",
  style,
}: GooeyNavProps) {
  const [internalIndex, setInternalIndex] = useState(initialActiveIndex);
  const [pill, setPill] = useState<PillRect | null>(null);
  const [burst, setBurst] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const currentIndex = activeIndex ?? internalIndex;

  useIsomorphicLayoutEffect(() => {
    const element = stage.current;
    if (!element) return;
    const update = () => {
      const target = element.querySelector<HTMLElement>(`[data-gooey-index="${currentIndex}"]`);
      const stageRect = element.getBoundingClientRect();
      if (!target || !stageRect.width) return;
      const rect = target.getBoundingClientRect();
      setPill({ x: rect.left - stageRect.left, y: rect.top - stageRect.top, width: rect.width, height: rect.height });
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [currentIndex, items.length]);

  const select = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (!items[index].href || items[index].href === "#") event.preventDefault();
    if (activeIndex === undefined) setInternalIndex(index);
    if (index !== currentIndex) setBurst((value) => value + 1);
    onChange?.(index, items[index]);
  };

  const variables = {
    ...themes[theme],
    "--gn-pill": color,
    "--gn-active-ink": activeTextColor,
    "--gn-duration": `${Math.max(200, animationTime)}ms`,
    "--gn-spread": `${Math.max(24, spread)}px`,
    "--gn-goo": `${Math.min(1, Math.max(0, gooeyness))}`,
    "--gn-wobble": `${Math.min(1, Math.max(0, wobble))}`,
    "--gn-particles": String(Math.min(20, Math.max(4, particleCount))),
    "--gn-variance": `${Math.max(0, timeVariance)}ms`,
    ...style,
  } as unknown as CSSProperties;

  return (
    <nav className={`gooey-nav gooey-nav--${size}${frame ? " gooey-nav--framed" : ""}${hoverEffect ? " gooey-nav--hover" : ""} ${className}`.trim()} style={variables} aria-label="Primary navigation">
      <div ref={stage} className="gooey-nav__stage">
        {pill && (
          <span
            className="gooey-nav__pill"
            style={{ transform: `translate(${pill.x}px, ${pill.y}px)`, width: pill.width, height: pill.height }}
            aria-hidden="true"
          />
        )}
        <span key={burst} className="gooey-nav__particles" aria-hidden="true">
          {Array.from({ length: Math.min(20, Math.max(4, particleCount)) }, (_, index) => {
            const angle = (index / Math.min(20, Math.max(4, particleCount))) * Math.PI * 2;
            const distance = Math.max(24, spread) * (0.52 + (index % 4) * 0.12);
            // Serialize custom-property values identically in Node and the browser
            // so the initial hydration markup is byte-for-byte deterministic.
            const x = (Math.cos(angle) * distance).toFixed(3);
            const y = (Math.sin(angle) * distance).toFixed(3);
            return <i key={index} style={{
              "--particle-index": String(index),
              "--particle-tx": `${x}px`,
              "--particle-ty": `${y}px`,
            } as CSSProperties} />;
          })}
        </span>
        <ul className="gooey-nav__list">
          {items.map((item, index) => (
            <li className="gooey-nav__item" data-gooey-index={index} data-active={index === currentIndex ? "" : undefined} key={item.href}>
              <a className="gooey-nav__link" href={item.href} aria-current={index === currentIndex ? "page" : undefined} onClick={(event) => select(event, index)}>
                {item.icon && <span className="gooey-nav__icon">{item.icon}</span>}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      {frame && <span className="gooey-nav__rim" aria-hidden="true" />}
    </nav>
  );
}
