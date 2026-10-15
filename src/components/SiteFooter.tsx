import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const footerLinks = [
  { href: "/gifts", label: "Gifts catalogue" },
  { href: "/gifts/find", label: "Gift Finder" },
  { href: "/gifts/box", label: "Build a Box" },
  { href: "/studio", label: "Studio" },
  { href: "/company-stores", label: "Company Stores" },
  { href: "/gifts/brief", label: "My Brief" },
  { href: "/#gift-ideas", label: "Gift ideas" },
  { href: "/#enquire", label: "Consultation" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer" id="contact">
      <div className="site-footer__inner">
        <Reveal variant="fade" className="site-footer__brand">
          <Link href="/" aria-label="Monkcraft home">
            <Image
              src="/brand/Monkcraft-White-Horizontal.png"
              alt="Monkcraft"
              width={200}
              height={36}
              style={{ width: "auto", height: "auto", maxHeight: "2.25rem" }}
            />
          </Link>
          <p className="site-footer__tagline">
            Premium corporate gifting for modern Indian teams.
          </p>
        </Reveal>

        <Reveal as="nav" variant="fade" delayMs={80} className="site-footer__nav" aria-label="Footer">
          <ul>
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal variant="fade" delayMs={160} className="site-footer__cta">
          <p className="site-footer__cta-label">Ready to plan a programme?</p>
          <Link className="site-footer__button" href="/gifts/brief">
            Open My Brief
          </Link>
          <Link className="site-footer__button site-footer__button--ghost" href="/#enquire">
            Talk to Monkcraft
          </Link>
          <p className="site-footer__legal">
            Legal pages and a public contact email will appear here once supplied.
            Online enquiry delivery activates when a verified inbox, booking URL,
            or WhatsApp number is configured.
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
