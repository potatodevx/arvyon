import { ArrowUpRight } from "lucide-react";

type SiteFooterProps = {
  home?: boolean;
};

export function SiteFooter({ home = false }: SiteFooterProps) {
  const topHref = home ? "#top" : "/#top";

  return (
    <footer className="site-footer">
      <a className="wordmark" href={topHref} aria-label="Back to XYZ Innovations home">
        <span className="wordmark-mark">X</span><span>XYZ Innovations</span>
      </a>
      <p>© 2026 XYZ Innovations</p>
      <a href={topHref} className="footer-back">Back to top <ArrowUpRight size={15} /></a>
    </footer>
  );
}
