"use client";

import { useEffect, useId, useRef, useState } from "react";

type BrandVideoBandProps = {
  id?: string;
  title: string;
  durationLabel: string;
  caption?: string;
  src: string;
  poster: string;
  /** Optional widescreen cut; the portrait source remains the mobile version. */
  desktopSrc?: string;
  desktopPoster?: string;
  /** Preserve the complete source frame, including portrait films on desktop. */
  fitContent?: boolean;
  /** Soft brand wash behind the poster crop */
  tone?: "lilac" | "apricot" | "mint";
  ariaLabel: string;
};

/**
 * Swag-inspired full-width play band: large play control + title,
 * poster stage, then a responsive player that uses the available screen well.
 */
export function BrandVideoBand({
  id,
  title,
  durationLabel,
  caption,
  src,
  poster,
  desktopSrc,
  desktopPoster,
  fitContent = false,
  tone = "lilac",
  ariaLabel,
}: BrandVideoBandProps) {
  const [playing, setPlaying] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleId = useId();
  const activeSrc = desktopSrc && isDesktop ? desktopSrc : src;
  const activePoster = desktopPoster && isDesktop ? desktopPoster : poster;

  useEffect(() => {
    const media = window.matchMedia("(min-width: 720px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    if (playing) {
      void video.play().catch(() => {
        /* autoplay may be blocked until a second gesture */
      });
    } else {
      video.pause();
    }
  }, [activeSrc, playing]);

  return (
    <section
      id={id}
      className={`brand-video-band brand-video-band--${tone}${desktopSrc ? " brand-video-band--responsive" : ""}${fitContent ? " brand-video-band--fit-content" : ""}`}
      aria-labelledby={titleId}
    >
      <div
        className="brand-video-band__stage"
        style={{ backgroundImage: `url(${activePoster})` }}
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
                poster={activePoster}
                aria-label={ariaLabel}
              >
                <source src={activeSrc} type="video/mp4" />
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
