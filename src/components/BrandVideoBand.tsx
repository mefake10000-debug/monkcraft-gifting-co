"use client";

import { useEffect, useId, useRef, useState } from "react";

type BrandVideoBandProps = {
  title: string;
  durationLabel: string;
  caption?: string;
  src: string;
  poster: string;
  /** Soft brand wash behind the poster crop */
  tone?: "lilac" | "apricot" | "mint";
  ariaLabel: string;
};

/**
 * Swag-inspired full-width play band: large play control + title,
 * poster stage, then a clarity-first portrait player (contain, not crop).
 */
export function BrandVideoBand({
  title,
  durationLabel,
  caption,
  src,
  poster,
  tone = "lilac",
  ariaLabel,
}: BrandVideoBandProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      void video.play().catch(() => {
        /* autoplay may be blocked until a second gesture */
      });
    } else {
      video.pause();
    }
  }, [playing]);

  return (
    <section
      className={`brand-video-band brand-video-band--${tone}`}
      aria-labelledby={titleId}
    >
      <div
        className="brand-video-band__stage"
        style={{ backgroundImage: `url(${poster})` }}
      >
        <div className="brand-video-band__wash" aria-hidden="true" />

        {!playing ? (
          <button
            type="button"
            className="brand-video-band__play"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${ariaLabel}`}
          >
            <span className="brand-video-band__play-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" width="48" height="48" focusable="false">
                <circle cx="24" cy="24" r="23" fill="#ffffff" />
                <path d="M19 15.5v17l14-8.5-14-8.5z" fill="#662F90" />
              </svg>
            </span>
            <span className="brand-video-band__copy">
              <span id={titleId} className="brand-video-band__title">
                {title}
              </span>
              <span className="brand-video-band__duration">{durationLabel}</span>
            </span>
          </button>
        ) : (
          <div className="brand-video-band__player">
            <div className="brand-video-band__frame">
              <video
                ref={videoRef}
                controls
                playsInline
                preload="auto"
                poster={poster}
                aria-label={ariaLabel}
              >
                <source src={src} type="video/mp4" />
              </video>
            </div>
            <button
              type="button"
              className="brand-video-band__close"
              onClick={() => setPlaying(false)}
            >
              Close video
            </button>
          </div>
        )}
      </div>
      {caption ? (
        <p className="brand-video-band__caption">{caption}</p>
      ) : null}
    </section>
  );
}
