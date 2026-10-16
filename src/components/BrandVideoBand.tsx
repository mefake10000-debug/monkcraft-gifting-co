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
 * Swag-inspired video feature with responsive portrait/landscape playback.
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
        className={`brand-video-band__stage${playing ? " brand-video-band__stage--playing" : ""}`}
        style={{ backgroundImage: `url(${activePoster})` }}
      >
        <div className="brand-video-band__art" aria-hidden="true" />
        <div className="brand-video-band__wash" aria-hidden="true" />

        {!playing ? (
          <button
            type="button"
            className="brand-video-band__play"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${ariaLabel}`}
          >
            <span className="brand-video-band__play-icon" aria-hidden="true">
              <span className="brand-video-band__play-triangle" />
            </span>
            <span className="brand-video-band__copy">
              <span id={titleId} className="brand-video-band__title">
                {title}
              </span>
              <span className="brand-video-band__meta">
                <span className="brand-video-band__duration">{durationLabel}</span>
                <span className="brand-video-band__watch">Watch the film</span>
              </span>
            </span>
          </button>
        ) : (
          <div className="brand-video-band__player">
            <div className="brand-video-band__frame">
              <video
                ref={videoRef}
                controls
                playsInline
                preload="none"
                poster={activePoster}
                aria-label={ariaLabel}
              >
                <source src={activeSrc} type="video/mp4" />
                Your browser does not support video playback.
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
