import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { getContactChannels } from "@/lib/contactConfig";
import { buildWhatsAppHref } from "@/lib/whatsapp";
import { BOX_CATALOGUE_HREF } from "@/lib/nav";

const footerLinks = [
  { href: "/gifts", label: "Catalogue" },
  { href: "/gifts/find", label: "Gift Finder" },
  { href: BOX_CATALOGUE_HREF, label: "Build a Box" },
  { href: "/gifts/favourites", label: "Saved gifts" },
  { href: "/studio", label: "Studio" },
  { href: "/company-stores", label: "Company Stores" },
  { href: "/gifts/brief", label: "My Brief" },
  { href: "/#enquire", label: "Consultation" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function SiteFooter() {
  const channels = getContactChannels();
  return (
    <footer className="site-footer" id="contact">
      <div className="site-footer__inner">
        <Reveal variant="fade" className="site-footer__brand">
          <Link href="/" aria-label="Monkcraft home">
            <Image
              src="/brand/Monkcraft-White-Horizontal.png"
              alt="Monkcraft"
              width={545}
              height={145}
              style={{ width: "auto", height: "2.25rem" }}
            />
          </Link>
          <p className="site-footer__tagline">
            Thoughtful gifts. Team spirit. A little Monkcraft.
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
          <p className="site-footer__cta-label">Got a gifting moment?</p>
          <Link className="site-footer__button" href="/gifts/brief">
            Open My Brief
          </Link>
          <Link className="site-footer__button site-footer__button--ghost" href="/#enquire">
            Talk to Monkcraft
          </Link>
          <p className="site-footer__legal">Big plan or quick question? We’re here.</p>
          {channels.enquiryEmail ? <a href={`mailto:${channels.enquiryEmail}`}>{channels.enquiryEmail}</a> : null}
          {channels.whatsappE164 ? <a href={buildWhatsAppHref("Hello Monkcraft, I have a question about corporate gifting.", channels.whatsappE164) ?? undefined} target="_blank" rel="noopener noreferrer">WhatsApp the team</a> : null}
        </Reveal>
      </div>
    </footer>
  );
}
