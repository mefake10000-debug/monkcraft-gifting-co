"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { SwagConcept } from "@/data/catalogue/swagConcepts";
import { SWAG_CONCEPTS } from "@/data/catalogue/swagConcepts";
import { getContactChannels } from "@/lib/contactConfig";
import { buildWhatsAppHref, buildWhatsAppPrefillMessage } from "@/lib/whatsapp";

type ProductColour = "Black" | "White";
function SwagCard({ concept }: { concept: SwagConcept }) {
  const [colour, setColour] = useState<ProductColour>("Black");
  const channels = getContactChannels();
  const message = buildWhatsAppPrefillMessage({
    occasion: "Custom Monkcraft company swag concept",
    productLines: [{ name: concept.name, id: concept.id }],
    branding: `Plain, unbranded mockup; product colour: ${colour}. No logo applied.`,
    notes: `Please help develop this custom concept. ${concept.specNote}`,
  });
  const quoteHref = buildWhatsAppHref(message, channels.whatsappE164);

  return (
    <li className="studio-swag-card">
      <div className={`studio-swag-card__visual studio-swag-card__visual--${colour.toLowerCase()}`}>
        <Image className={`studio-swag-card__product studio-swag-card__product--${colour.toLowerCase()}`} src={concept.image} alt={`${colour} ${concept.name} unbranded product mockup`} width={1000} height={1000} />
        <span className="studio-swag-card__concept-label">Plain concept mockup</span>
      </div>
      <div className="studio-swag-card__body">
        <div className="studio-swag-card__title-row"><div><span className="studio-swag-card__category">{concept.category}</span><h3>{concept.name}</h3></div></div>
        <p>{concept.description}</p>
        <details className="studio-swag-card__customise">
          <summary>Make it yours <span aria-hidden="true">＋</span></summary>
          <div className="studio-swag-card__controls">
            <fieldset><legend>Product colour</legend><div className="studio-swag-card__choices">{(["Black", "White"] as const).map((option) => <button type="button" key={option} aria-pressed={colour === option} onClick={() => setColour(option)}>{option}</button>)}</div></fieldset>
            <ul className="studio-swag-card__specs">{concept.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul>
            <p>Start with the look. We’ll confirm materials, sizes and production options with your quote.</p>
            {quoteHref ? <a href={quoteHref} target="_blank" rel="noopener noreferrer">Develop this concept on WhatsApp <span aria-hidden="true">→</span></a> : <Link href="/#enquire">Add this idea to an enquiry <span aria-hidden="true">→</span></Link>}
          </div>
        </details>
      </div>
    </li>
  );
}

export function SwagStarter() {
  const [query, setQuery] = useState("");
  const concepts = useMemo(() => SWAG_CONCEPTS.filter((concept) => `${concept.name} ${concept.category}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  return (
    <section className="studio-swag" aria-labelledby="studio-swag-heading">
      <header className="studio-swag__intro">
        <p className="studio-swag__eyebrow">Monkcraft concepts · your team, your vibe</p>
        <h2 id="studio-swag-heading">Pick your starting lineup.</h2>
        <p className="studio-swag__note">These are concept mockups. Prices, specifications and production options are confirmed with your quote.</p>
      </header>
      <label className="studio-swag__search">Find your kind of swag<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try bottle, desk or wear it" /></label>
      {concepts.length ? <ul className="studio-swag__grid">{concepts.map((concept) => <SwagCard key={concept.id} concept={concept} />)}</ul> : <p role="status" className="studio-swag__status">No concepts match that search. Try another word.</p>}
    </section>
  );
}
