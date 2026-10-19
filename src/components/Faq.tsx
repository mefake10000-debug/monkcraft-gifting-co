"use client";

import { useId, useState } from "react";
import { Reveal } from "@/components/Reveal";

const faqs = [
  {
    q: "Who is Monkcraft for?",
    a: "For the people making team moments happen: HR, founders, marketing and operations teams across India.",
  },
  {
    q: "Great occasion. No gift idea yet?",
    a: "That’s a good place to start. Tell us who it’s for, your budget and when you need it. We’ll work through the options with you.",
  },
  {
    q: "Do you support custom branding?",
    a: "Yes. Bring your logo; we’ll confirm the branding options and lead time for your chosen gifts.",
  },
  {
    q: "Can you fulfil across multiple cities?",
    a: "Share the cities and quantities in your enquiry so we can plan delivery with you.",
  },
  {
    q: "How do I go from “love it” to a quote?",
    a: "Browse the catalogue, add your picks to My Brief and request a quote. We confirm prices, availability, branding and delivery before you order.",
  },
  {
    q: "How do Company Stores work?",
    a: "Your brand, your gift collection, their choice. Try the demo to explore the setup and employee view. Access, credits and delivery are agreed with us before launch; the demo creates no live accounts or orders.",
  },
] as const;

export function Faq() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState(-1);

  return (
    <section id="faq" className="faq" aria-labelledby="faq-heading">
      <div className="faq__inner">
        <Reveal as="header" className="faq__intro">
          <p className="faq__eyebrow">FAQ</p>
          <h2 id="faq-heading" className="faq__heading">
            Good questions. Straight answers.
          </h2>
          <p className="faq__lede">
            A few things to know before the good gifting begins.
          </p>
        </Reveal>

        <div className="faq__list">
          {faqs.map((item, index) => {
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            const isOpen = openIndex === index;

            return (
              <Reveal
                key={item.q}
                delayMs={index * 40}
                className={`faq__item${isOpen ? " faq__item--open" : ""}`}
              >
                <h3 className="faq__question">
                  <button
                    id={buttonId}
                    type="button"
                    className="faq__trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  >
                    <span>{item.q}</span>
                    <span className="faq__icon" aria-hidden="true">
                      {isOpen ? "–" : "+"}
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className="faq__answer"
                  hidden={!isOpen}
                >
                  <p>{item.a}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
