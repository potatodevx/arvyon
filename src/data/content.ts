// TODO: Replace these illustrative project narratives with approved client case-study copy before launch.
export type Project = {
  number: string;
  slug: string;
  href: string;
  category: string;
  title: string;
  description: string;
  accent: "vermillion" | "ink" | "rose";
  image: string;
  imageAlt: string;
};

export type Service = {
  index: string;
  title: string;
  text: string;
  detail: string;
  icon: "braces" | "bot" | "layers";
};

export type ApproachStep = {
  index: string;
  title: string;
  text: string;
};

export const projects: Project[] = [
  {
    number: "01",
    slug: "platform-system",
    href: "/work/platform-system",
    category: "Operations platform / 2026",
    title: "A calmer control room",
    description: "A layered platform concept shaped around fast, confident decisions when the work is moving quickly.",
    accent: "vermillion",
    image: "/assets/project-platform.png",
    imageAlt: "Abstract layered platform concept with warm red highlights",
  },
  {
    number: "02",
    slug: "signal-product",
    href: "/work/signal-product",
    category: "Intelligent product / 2026",
    title: "Signals people can act on",
    description: "A product direction that brings a stream of changing information into one deliberate next move.",
    accent: "ink",
    image: "/assets/project-signal.png",
    imageAlt: "Abstract signal and data concept with oxblood accents",
  },
  {
    number: "03",
    slug: "connected-system",
    href: "/work/connected-system",
    category: "Connected system / 2026",
    title: "One system, many moving parts",
    description: "A connected-system concept that makes complex relationships visible without making them feel heavy.",
    accent: "rose",
    image: "/assets/project-orbit.png",
    imageAlt: "Abstract connected technology system with warm paper and red details",
  },
];

export const services: Service[] = [
  {
    index: "01",
    title: "Product engineering",
    text: "Web platforms and digital products designed to be useful, clear, and built to last.",
    detail: "From technical foundations to interfaces, we build focused releases that can grow without losing clarity.",
    icon: "braces",
  },
  {
    index: "02",
    title: "Intelligent systems",
    text: "Thoughtful AI and automation that remove friction from real workflows.",
    detail: "We map the human decisions first, then design practical systems around the work that matters.",
    icon: "bot",
  },
  {
    index: "03",
    title: "Digital experiences",
    text: "Interfaces and brand moments that make complex technology feel natural.",
    detail: "We turn dense product value into clear, expressive interactions that invite people to explore.",
    icon: "layers",
  },
];

export const approachSteps: ApproachStep[] = [
  { index: "01", title: "Define", text: "Find the real problem, make the priorities visible, and create a clear direction." },
  { index: "02", title: "Build", text: "Design and engineer the experience in close feedback loops, from foundation to finish." },
  { index: "03", title: "Improve", text: "Launch deliberately, learn from use, and make the next useful decision together." },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}
