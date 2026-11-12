"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SiteHeaderProps = {
  home?: boolean;
};

const links = [
  { href: "#top", label: "Home" },
  { href: "#work", label: "Work" },
  { href: "#services", label: "Services" },
  { href: "#approach", label: "Approach" },
  { href: "#contact", label: "Contact" },
];

export function SiteHeader({ home = false }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const hrefFor = (hash: string) => (home ? hash : `/${hash}`);

  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    if (!menuOpen) return;

    const body = document.body;
    const originalOverflow = body.style.overflow;
    if (window.matchMedia("(max-width: 640px)").matches) body.style.overflow = "hidden";

    const focusable = () =>
      Array.from(menu.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []).filter(
        (element) => !element.hasAttribute("disabled"),
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        toggle.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.requestAnimationFrame(() => focusable()[0]?.focus());

    return () => {
      body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const element = header.current;
    if (!element) return;

    const setHeaderHeight = () => {
      document.documentElement.style.setProperty("--header-h", `${element.getBoundingClientRect().height}px`);
    };
    const observer = new ResizeObserver(setHeaderHeight);
    observer.observe(element);
    setHeaderHeight();

    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--header-h");
    };
  }, []);

  return (
    <header ref={header} className={`site-header${menuOpen ? " is-menu-open" : ""}`}>
      <a className="wordmark" href={hrefFor("#top")} onClick={closeMenu} aria-label="XYZ Innovations home">
        <span className="wordmark-mark">X</span>
        <span>XYZ Innovations</span>
      </a>

      <nav className="desktop-nav" aria-label="Primary navigation">
        {links.map((link) => (
          <a href={hrefFor(link.href)} aria-current={link.href === "#top" ? "page" : undefined} onClick={closeMenu} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <button
        ref={toggle}
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <nav
        ref={menu}
        id="primary-navigation"
        className={`main-nav${menuOpen ? " is-open" : ""}`}
        aria-label="Primary navigation"
      >
        {links.filter((link) => link.href !== "#contact").map((link) => (
          <a href={hrefFor(link.href)} onClick={closeMenu} key={link.href}>{link.label}</a>
        ))}
        <a href={hrefFor("#contact")} onClick={closeMenu} className="nav-contact">Let&apos;s talk <ArrowUpRight size={15} /></a>
      </nav>
    </header>
  );
}
