"use client";

import { useEffect, useState } from "react";

const phrases = [
  "For team wins.",
  "For first-day buzz.",
  "For clients who get it.",
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
      <span className="visually-hidden">
        Corporate gifts for team wins, new joiners and client thank-yous.
      </span>
      <span className="hero__title-visual" aria-hidden="true">
        <span>Good gifts.</span>
        <span className="hero__rotator">
          {phrases.map((phrase, index) => (
            <span
              className={`hero__rotator-word hero__rotator-word--${index}${activePhrase === index ? " hero__rotator-word--active" : ""}`}
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
