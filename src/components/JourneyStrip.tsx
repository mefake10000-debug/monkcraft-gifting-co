import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const steps = [
  {
    n: "01",
    title: "Choose gifts",
    text: "Find gifts by occasion, product, budget or brand.",
    href: "/gifts",
    cta: "Browse the catalogue",
  },
  {
    n: "02",
    title: "Make it yours",
    text: "Choose products, packaging and branding.",
    href: "/gifts/box",
    cta: "Build a Box",
  },
  {
    n: "03",
    title: "Quote",
    text: "Share your picks. We’ll confirm the details before you order.",
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
            From “that’s the one” to a plan.
          </h2>
          <p className="journey-strip__lede">
            Browse, build your selection, then request a quote.
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
