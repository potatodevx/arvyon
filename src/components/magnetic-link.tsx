"use client";

import { type AnchorHTMLAttributes, useRef } from "react";

type MagneticLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export function MagneticLink({ children, onPointerLeave, onPointerMove, ...props }: MagneticLinkProps) {
  const link = useRef<HTMLAnchorElement>(null);

  const isEnabled = () =>
    window.matchMedia("(min-width: 701px) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;

  return (
    <a
      {...props}
      ref={link}
      onPointerMove={(event) => {
        if (isEnabled() && link.current) {
          const bounds = link.current.getBoundingClientRect();
          const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
          const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;
          link.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        if (link.current) link.current.style.transform = "translate3d(0, 0, 0)";
        onPointerLeave?.(event);
      }}
    >
      {children}
    </a>
  );
}
