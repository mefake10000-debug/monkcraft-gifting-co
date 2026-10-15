import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const steps = [
  {
    n: "01",
    title: "Discover",
    text: "Browse the catalogue or use Gift Finder to match occasion and budget.",
    href: "/gifts",
    cta: "Browse gifts",
  },
  {
    n: "02",
    title: "Shape",
    text: "Build a box, shortlist products, or mock branding in Studio.",
    href: "/gifts/box",
    cta: "Build a Box",
  },
  {
    n: "03",
    title: "Quote",
    text: "Open My Brief, gather everything in one place, then prepare a quotation request.",
    href: "/gifts/brief",
    cta: "Open My Brief",
  },
] as const;

/** Lightweight homepage path — one job: show how discovery becomes a brief. */
export function JourneyStrip() {
  return (
    <section className="journey-strip" aria-labelledby="journey-strip-heading">
      <div className="journey-strip__inner">
        <Reveal as="header" className="journey-strip__intro">
          <p className="journey-strip__eyebrow">How it works</p>
          <h2 id="journey-strip-heading" className="journey-strip__heading">
            From idea to quotation brief.
          </h2>
          <p className="journey-strip__lede">
            Everything you select stays in this browser until you prepare a
            brief. Online delivery activates only when Monkcraft configures a
            verified channel.
          </p>
        </Reveal>
        <ol className="journey-strip__steps">
          {steps.map((step, index) => (
            <Reveal
              as="li"
              key={step.n}
              delayMs={index * 80}
              className="journey-strip__step"
            >
              <span className="journey-strip__n" aria-hidden="true">
                {step.n}
              </span>
              <h3 className="journey-strip__title">{step.title}</h3>
              <p className="journey-strip__text">{step.text}</p>
              <Link className="journey-strip__link" href={step.href}>
                {step.cta}
              </Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
