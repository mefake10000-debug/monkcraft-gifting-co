"use client";

import { useId, useState } from "react";
import { Reveal } from "@/components/Reveal";

const faqs = [
  {
    q: "Who is Monkcraft for?",
    a: "For Indian HR, founder, marketing and operations teams planning gifts, branded merchandise, kits or employee stores.",
  },
  {
    q: "Can you help if we don’t know the exact products yet?",
    a: "Yes. Share the occasion, quantity, branding needs, timeline and budget. We’ll suggest options and refine a quote with you.",
  },
  {
    q: "Do you support custom branding?",
    a: "Yes. Branding methods and lead times depend on the products selected.",
  },
  {
    q: "Can you fulfil across multiple cities?",
    a: "Share the cities and quantities in your enquiry so we can plan delivery with you.",
  },
  {
    q: "Is there a full online catalogue yet?",
    a: "Yes. Browse thousands of products, set quantities and request a quote; Monkcraft confirms pricing and availability. Studio previews branding and builds client catalogues. Company Stores has a configurator and employee preview, but it is not a live commerce platform.",
  },
  {
    q: "How do Company Stores work?",
    a: "A Company Store is a branded gift collection for employees, separate from the public catalogue. Configure a sample, then agree access, credits, order review and delivery with Monkcraft. The demo does not create accounts, deduct live credits or place orders.",
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
