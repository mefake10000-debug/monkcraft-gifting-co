"use client";

import { useId, useState } from "react";
import { Reveal } from "@/components/Reveal";

const faqs = [
  {
    q: "Who is Monkcraft for?",
    a: "People and teams who plan corporate gifting in India — HR, founders, marketing, and ops leads who need curated gifts, branded merchandise, kits, or a simpler way to run employee stores.",
  },
  {
    q: "Can you help if we don’t know the exact products yet?",
    a: "Yes. Share the occasion, approximate quantity, branding needs, timeline, and budget band. We’ll propose directions and refine toward a quotation.",
  },
  {
    q: "Do you support custom branding?",
    a: "Custom-branded merchandise and coordinated kits are a core part of what we do. Exact print methods and lead times depend on the products you choose.",
  },
  {
    q: "Can you fulfil across multiple cities?",
    a: "Multi-location gifting is a common need for Indian teams. Tell us the cities and quantities in your enquiry so we can plan fulfilment with you.",
  },
  {
    q: "Is there a full online catalogue yet?",
    a: "Yes — browse the live gifts catalogue at /gifts (thousands of verified products). Shortlist items, set quantities, build a gifting brief, then prepare a quotation message. Monkcraft Studio at /studio lets you preview branding on products and assemble a white-label client catalogue. Company Stores at /company-stores offers a demo configurator and employee preview — not a live private commerce platform yet.",
  },
  {
    q: "How do Company Stores work?",
    a: "A Company Store is a branded, company-specific merchandise experience for your team — not the public catalogue. Visit /company-stores to learn more, draft a proposed store in the demo configurator, or request one through the consultation form. Live employee auth and fulfilment are provisioned with Monkcraft; the demo does not authenticate users or submit real orders.",
  },
] as const;

export function Faq() {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="faq" aria-labelledby="faq-heading">
      <div className="faq__inner">
        <Reveal as="header" className="faq__intro">
          <p className="faq__eyebrow">FAQ</p>
          <h2 id="faq-heading" className="faq__heading">
            Questions teams usually ask
          </h2>
          <p className="faq__lede">
            Straight answers for corporate gifting decisions — without invented
            claims or placeholder metrics.
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
