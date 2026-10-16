"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const VIDEO = "/hero/monkcraft-hero-landing.mp4";
const POSTER = "/hero/monkcraft-hero-landing-poster.jpg";

export function HeroLandingMedia() {
  const [showVideo, setShowVideo] = useState(false);
  const [playFailed, setPlayFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.playbackRate = 0.9;
    void video.play().then(() => setShowVideo(true)).catch(() => setPlayFailed(true));
  }, []);

  return (
    <div className="hero__media hero__media--desktop">
      <Image
        className="hero__media-image"
        src={POSTER}
        alt="Monkcraft gifting scene"
        fill
        priority
        quality={92}
        sizes="100vw"
      />
      <video
        ref={videoRef}
        className={`hero__media-video ${showVideo ? "hero__media-video--visible" : "hero__media-video--hidden"}`}
        src={VIDEO}
        poster={POSTER}
        muted
        autoPlay
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        onPlaying={() => setShowVideo(true)}
      />
      {playFailed ? (
        <button
          className="hero__media-play-fallback"
          type="button"
          onClick={() => {
            void videoRef.current?.play().then(() => {
              setShowVideo(true);
              setPlayFailed(false);
            });
          }}
        >
          Play animation
        </button>
      ) : null}
    </div>
  );
}
