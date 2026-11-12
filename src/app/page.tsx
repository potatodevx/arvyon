"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Bot,
  Braces,
  Layers3,
  MoveRight,
  Plus,
} from "lucide-react";
import { approachSteps, projects, services } from "@/data/content";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useStoryChapter } from "@/hooks/use-story-chapter";
import { useWorkSpiral } from "@/hooks/use-work-spiral";
import { MagneticLink } from "@/components/magnetic-link";
import RotatingText from "@/components/rotating-text";
import { CustomCursor } from "@/components/custom-cursor";
import { HeroPreloader } from "@/components/hero-preloader";
import { RibbonFallback } from "@/components/ribbon-fallback";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const SiteThreadScene = dynamic(() => import("@/components/site-thread-scene"), {
  ssr: false,
  loading: () => <RibbonFallback />,
});

const DitherVeil = dynamic(() => import("@/components/DitherVeil"), {
  ssr: false,
  loading: () => <div className="hero-dither-fallback" aria-hidden="true" />,
});

const FadeContent = dynamic(() => import("@/components/FadeContent"), {
  ssr: false,
  loading: () => <div className="hero-copy-content" />,
});

const ParticleText = dynamic(() => import("@/components/particle-text"), {
  ssr: false,
  loading: () => <div className="particle-text-fallback" aria-hidden="true">Future, formed.</div>,
});

const OrbitImages = dynamic(() => import("@/components/OrbitImages"), {
  ssr: false,
  loading: () => <div className="work-orbit-fallback" aria-hidden="true" />,
});

const serviceIcons = {
  braces: Braces,
  bot: Bot,
  layers: Layers3,
};

const manifestoWords = ["We", "make", "technology", "feel", "considered,", "not", "complicated."];
const workOrbitImages = projects.map((project) => ({ src: project.image, alt: project.title }));

export default function Home() {
  useScrollProgress();
  useScrollReveal();
  useWorkSpiral();
  const chapter = useStoryChapter();

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="site-shell">
        <HeroPreloader />
        <CustomCursor />
        <div className="scroll-indicator" aria-hidden="true" />
        <div className={`site-thread${chapter.number === "06" ? " is-complete" : ""}`} aria-hidden="true"><SiteThreadScene /></div>
        <SiteHeader home />
        <p className="chapter-indicator" aria-hidden="true"><span>{chapter.number}</span> / {chapter.label}</p>

        <main id="main-content" tabIndex={-1}>
        <section className="hero" id="top" data-chapter="0">
          <div className="hero-dither" data-reveal>
            <DitherVeil
              fit="contain"
              pattern="floyd"
              pixelSize={2}
              inkColor="#281d1b"
              paperColor="#f4ede3"
              revealRadius={190}
              softness={0.6}
              linger={1}
              rimColor="#941f31"
              palette="duotone"
              levels={2}
              contrast={1.15}
              brightness={0}
              rim={0}
              reverse={false}
              wander={false}
              clickBurst
            />
          </div>
          <div className="hero-copy">
            <FadeContent className="hero-copy-content" effect="mist" duration={1.8} ease="power2.out" stagger={0.1} threshold={0.1} trigger="mount">
              <p className="eyebrow"><span /> Independent technology studio</p>
              <h1 className="hero-title">
                <span className="hero-line"><span>Ideas,</span></span>
                <span className="hero-line hero-line-serif"><span><em>given form.</em></span></span>
              </h1>
              <p className="hero-intro">
                Software, AI and digital products, engineered with craft.
              </p>
              <div className="hero-actions">
                <a href="#work" className="button button-primary">Explore our work <MoveRight size={18} /></a>
                <a href="#services" className="button button-quiet">What we do <ArrowDown size={17} /></a>
              </div>
            </FadeContent>
          </div>

          <p className="scene-caption"><span className="caption-dot" /> Interfaces begin as signals.</p>
          <a className="hero-scroll-cue" href="#manifesto" aria-label="Scroll to the point of view"><span aria-hidden="true" />Scroll</a>
        </section>

        <section className="manifesto section" id="manifesto" data-chapter="1">
          <div className="section-label" data-reveal>
            <span>02</span><p>The point of view</p>
          </div>
          <div className="manifesto-statement" data-reveal>
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
          <div className="section-heading" data-reveal>
            <div className="section-label"><span>03</span><p>The proof</p></div>
            <h2>Proof lives in<br /><em>the details.</em></h2>
            <p>Every turn of the thread is a decision made clearer, kinder, and easier to use.</p>
          </div>

          <div className="work-list" data-work-spiral aria-label="Selected project case studies">
            <div className="work-orbit-showcase" aria-hidden="true">
              <OrbitImages
                images={workOrbitImages}
                altPrefix="Project preview"
                shape="ellipse"
                baseWidth={1080}
                radiusX={435}
                radiusY={122}
                rotation={-7}
                duration={30}
                itemSize={164}
                direction="reverse"
                showPath
                pathColor="rgba(148,31,49,0.22)"
                pathWidth={1}
                fill
                depth={0.34}
                itemRadius={18}
                shadow={0.18}
                hoverScale={1}
                draggable={false}
                clickToFront={false}
                intro
                centerContent={<p className="work-orbit-label"><span>Selected work</span>03 cases</p>}
              />
            </div>
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
          <div className="services-intro" data-reveal>
            <div className="section-label"><span>04</span><p>The craft</p></div>
            <h2>
              From first<br />
              <RotatingText
                texts={["signal", "prototype", "system"]}
                effect="slide"
                direction="up"
                highlight
                highlightColor="#941f31"
                staggerFrom="last"
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden"
                rotationInterval={2200}
                splitBy="characters"
                blur={0}
                auto
                loop
                pauseOnHover={false}
              /> {" "}to <em>scale.</em>
            </h2>
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
          <div className="approach-layout">
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
        <div className="contact-content">
          <p className="eyebrow" data-reveal><span /> The result</p>
            <h2 data-reveal>Let&apos;s build<br /><em>what&apos;s next.</em></h2>
            <p className="contact-copy" data-reveal>Have a problem worth solving? Share the shape of it and we&apos;ll find a way forward.</p>
            <MagneticLink href="mailto:hello@xyzinnovations.com" className="contact-email" data-reveal>
              hello@xyzinnovations.com <ArrowUpRight size={25} />
            </MagneticLink>
            <p className="contact-note" data-reveal>A thoughtful first note is enough to begin.</p>
          </div>
          <div className="contact-particle-stage" data-reveal>
            <ParticleText
              text="Future, formed."
              particleSize={1.9}
              density={5}
              color="currentColor"
              highlightColor="#941f31"
              highlightMode="motion"
              shape="circle"
              intro="gather"
              scatter={190}
              gatherDuration={1600}
              stagger={420}
              clickBurst
              burstStrength={1}
              pointerRepel={34}
              repelRadius={110}
              idleDrift={0}
              trigger="mount"
              fontSize="clamp(3rem, 7.4vw, 7.2rem)"
              fontWeight={800}
              fontFamily="inherit"
              glow={false}
            />
          </div>
        </section>

        </main>
        <SiteFooter home />
      </div>
    </>
  );
}
