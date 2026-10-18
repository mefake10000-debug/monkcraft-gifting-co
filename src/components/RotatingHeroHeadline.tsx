"use client";

import { useEffect, useState } from "react";

const phrases = [
  "for new starters.",
  "for teams.",
  "for clients.",
];

export function RotatingHeroHeadline() {
  const [activePhrase, setActivePhrase] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActivePhrase((current) => (current + 1) % phrases.length);
    }, 3400);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <h1 className="hero__title">
      <span className="sr-only">
        Corporate gifting for new starters, teams and clients.
      </span>
      <span className="hero__title-visual" aria-hidden="true">
        <span>Corporate gifting</span>
        <span className="hero__rotator">
          {phrases.map((phrase, index) => (
            <span
              className={`hero__rotator-word${activePhrase === index ? " hero__rotator-word--active" : ""}`}
              key={phrase}
            >
              {phrase}
            </span>
          ))}
        </span>
      </span>
    </h1>
  );
}
