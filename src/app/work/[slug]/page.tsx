import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getProjectBySlug, projects } from "@/data/content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type CaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Case study | XYZ Innovations" };

  return {
    title: `${project.title} | XYZ Innovations`,
    description: project.description,
    openGraph: {
      title: `${project.title} | XYZ Innovations`,
      description: project.description,
      images: [{ url: project.image, alt: project.imageAlt }],
    },
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return (
      <div className="site-shell case-study">
        <SiteHeader />
        <main id="main-content" tabIndex={-1}><section className="case-study-empty section"><h1>Case study not found.</h1><Link href="/#work" className="text-link"><ArrowLeft size={16} /> Back to work</Link></section></main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="site-shell case-study">
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
        <section className="case-study-hero section">
          <Link href="/#work" className="back-link"><ArrowLeft size={17} /> Back to selected work</Link>
          <p className="eyebrow"><span /> {project.category}</p>
          <h1>{project.title}</h1>
          <p>{project.description}</p>
          <div className="case-study-media">
            <Image src={project.image} alt={project.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 1100px" />
          </div>
        </section>
        <section className="case-study-detail section">
          <div><p className="section-kicker">The brief</p><p>Every engagement starts by making the situation legible: the people, the decisions, and the constraints that matter.</p></div>
          <div><p className="section-kicker">The contribution</p><p>Strategy, experience design, and engineering move together in small, useful increments from first sketch to working system.</p></div>
          <a href="mailto:hello@xyzinnovations.com" className="text-link">Start a related project <ArrowUpRight size={16} /></a>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
