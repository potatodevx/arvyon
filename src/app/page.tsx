"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Bot,
  Braces,
  Layers3,
  MoveRight,
  Plus,
  Sparkles,
} from "lucide-react";
import { approachSteps, projects, services } from "@/data/content";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useStoryChapter } from "@/hooks/use-story-chapter";
import { MagneticLink } from "@/components/magnetic-link";
import { CustomCursor } from "@/components/custom-cursor";
import { HeroPreloader } from "@/components/hero-preloader";
import { RibbonFallback } from "@/components/ribbon-fallback";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const SiteThreadScene = dynamic(() => import("@/components/site-thread-scene"), {
  ssr: false,
  loading: () => <RibbonFallback />,
});

const HeroSilkField = dynamic(() => import("@/components/hero-silk-field"), {
  ssr: false,
  loading: () => <div className="hero-field hero-field-fallback" aria-hidden="true" />,
});

const serviceIcons = {
  braces: Braces,
  bot: Bot,
  layers: Layers3,
};

const manifestoWords = ["We", "make", "technology", "feel", "considered,", "not", "complicated."];

export default function Home() {
  useScrollProgress();
  useScrollReveal();
  const chapter = useStoryChapter();

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="site-shell">
        <HeroPreloader />
        <CustomCursor />
        <div className="scroll-indicator" aria-hidden="true" />
        <div className="site-thread" aria-hidden="true"><SiteThreadScene /></div>
        <SiteHeader home />
        <p className="chapter-indicator" aria-hidden="true"><span>{chapter.number}</span> / {chapter.label}</p>

        <main id="main-content" tabIndex={-1}>
        <section className="hero" id="top" data-chapter="0">
          <HeroSilkField />
          <div className="hero-copy">
            <p className="eyebrow"><span /> Independent technology studio</p>
            <h1 className="hero-title">
              <span className="hero-line"><span>Ideas,</span></span>
              <span className="hero-line hero-line-serif"><em>given form.</em></span>
            </h1>
            <p className="hero-intro">
              XYZ Innovations turns ambitious concepts into clear, capable digital products and experiences.
            </p>
            <div className="hero-actions">
              <a href="#work" className="button button-primary">Explore our work <MoveRight size={18} /></a>
              <a href="#services" className="button button-quiet">What we do <ArrowDown size={17} /></a>
            </div>
          </div>

          <p className="scene-caption"><span className="caption-dot" /> Every idea starts as a loose thread.</p>
          <a className="hero-scroll-cue" href="#manifesto" aria-label="Scroll to the point of view"><span aria-hidden="true" />Scroll</a>
        </section>

        <section className="manifesto section" id="manifesto" data-chapter="1">
          <div className="section-label" data-reveal>
            <span>02</span><p>The point of view</p>
          </div>
          <div className="manifesto-statement text-scrim" data-reveal>
            <p className="display-copy" aria-label="We make technology feel considered, not complicated.">
              {manifestoWords.map((word, index) => (
                <span className={word === "considered," ? "is-accent" : undefined} style={{ "--word-index": index } as CSSProperties} key={word}>
                  {word}{" "}
                </span>
              ))}
            </p>
            <div className="manifesto-detail">
              <p>Small by design, we work closely with teams that value sharp thinking, genuine craft, and momentum.</p>
              <a href="#approach" className="text-link">How we work <ArrowUpRight size={16} /></a>
            </div>
            <div className="material-callout" data-reveal>
              <div>
                <p className="material-label">Material language</p>
                <p>Warm paper, ink, a little grain, and one oxblood thread.</p>
              </div>
              <div className="material-image">
                <Image
                  src="/assets/material-direction.png"
                  alt="Visual material direction featuring a red ribbon, warm paper, and tactile printed surfaces"
                  fill
                  sizes="(max-width: 640px) 100vw, 250px"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="work-section section" id="work" data-chapter="2">
          <div className="section-heading text-scrim" data-reveal>
            <div className="section-label"><span>03</span><p>The proof</p></div>
            <h2>Proof lives in<br /><em>the details.</em></h2>
            <p>Every turn of the thread is a decision made clearer, kinder, and easier to use.</p>
          </div>

          <div className="work-list" aria-label="Selected project case studies">
            {projects.map((project, index) => (
              <article className={`project-card project-${project.accent}`} key={project.slug} data-reveal>
                <div className="project-visual">
                  <div className="project-no">{project.number}</div>
                  <Image
                    className="project-image"
                    src={project.image}
                    alt={project.imageAlt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 900px) 70vw, 72vw"
                  />
                  <div className="project-image-wash" aria-hidden="true" />
                </div>
                <div className="project-copy">
                  <p className="project-category">{project.category}</p>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <Link href={project.href} className="text-link">View case study <ArrowUpRight size={16} /></Link>
                </div>
                <span className="project-index">0{index + 1} / 03</span>
              </article>
            ))}
          </div>
        </section>

        <section className="services-section section" id="services" data-chapter="3">
          <div className="services-intro text-scrim" data-reveal>
            <div className="section-label"><span>04</span><p>The craft</p></div>
            <h2>From first<br />signal to <em>scale.</em></h2>
          </div>
          <div className="service-list">
            {services.map((service) => {
              const Icon = serviceIcons[service.icon];
              return (
                <details className="service-row" key={service.index} data-reveal>
                  <summary>
                    <span className="service-index">{service.index}</span>
                    <Icon className="service-icon" size={25} strokeWidth={1.5} aria-hidden="true" />
                    <span className="service-summary-copy"><strong>{service.title}</strong><span>{service.text}</span></span>
                    <Plus className="service-plus" size={22} aria-hidden="true" />
                  </summary>
                  <div className="service-detail"><p>{service.detail}</p><a href="#contact">Discuss this capability <ArrowUpRight size={15} /></a></div>
                </details>
              );
            })}
          </div>
        </section>

        <section className="approach-section section" id="approach" data-chapter="4">
          <div className="approach-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="section-label" data-reveal><span>05</span><p>The method</p></div>
          <div className="approach-layout text-scrim">
            <h2 data-reveal>Built with<br /><em>clarity.</em></h2>
            <div className="approach-steps" data-reveal>
              {approachSteps.map((step) => (
                <article key={step.index}>
                  <span>{step.index}</span><h3>{step.title}</h3><p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section section" id="contact" data-chapter="5">
          <div className="contact-signal" aria-hidden="true"><Sparkles size={38} strokeWidth={1.1} /></div>
          <p className="eyebrow" data-reveal><span /> The result</p>
          <h2 data-reveal>Let&apos;s build<br /><em>what&apos;s next.</em></h2>
          <p className="contact-copy" data-reveal>Have a problem worth solving? Share the shape of it and we&apos;ll find a way forward.</p>
          <MagneticLink href="mailto:hello@xyzinnovations.com" className="contact-email" data-reveal>
            hello@xyzinnovations.com <ArrowUpRight size={25} />
          </MagneticLink>
          <p className="contact-note" data-reveal>A thoughtful first note is enough to begin.</p>
        </section>

        </main>
        <SiteFooter home />
      </div>
    </>
  );
}
