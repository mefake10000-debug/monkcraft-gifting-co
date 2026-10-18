"use client";

import { useState } from "react";
import type { MouseEvent } from "react";

export function BrandMarqueeControls() {
  const [paused, setPaused] = useState(false);

  function toggleMotion(event: MouseEvent<HTMLButtonElement>) {
    const nextPaused = !paused;
    const track = event.currentTarget
      .closest(".brand-marquee")
      ?.querySelector<HTMLElement>(".brand-marquee__track");
    track?.style.setProperty("animation-play-state", nextPaused ? "paused" : "running");
    setPaused(nextPaused);
  }

  const label = paused ? "Resume logo movement" : "Pause logo movement";

  return (
    <div className="brand-marquee__controls">
      <button
        type="button"
        className={`brand-marquee__control${paused ? " brand-marquee__control--paused" : ""}`}
        aria-label={label}
        aria-pressed={paused}
        title={label}
        onClick={toggleMotion}
      >
        <span className="brand-marquee__control-icon" aria-hidden="true" />
      </button>
    </div>
  );
}
