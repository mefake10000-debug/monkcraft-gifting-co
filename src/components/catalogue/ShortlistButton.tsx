"use client";

import { useEffect, useRef, useState } from "react";
import type { ShortlistSnapshot } from "@/lib/shortlist";
import {
  isShortlisted,
  readShortlist,
  toggleShortlist,
  addToShortlist,
  removeFromShortlist,
} from "@/lib/shortlist";

type ShortlistButtonProps = {
  snapshot: ShortlistSnapshot;
  initiallyShortlisted?: boolean;
  className?: string;
};

export function ShortlistButton({
  snapshot,
  initiallyShortlisted = false,
  className,
}: ShortlistButtonProps) {
  const [active, setActive] = useState(initiallyShortlisted);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sync = () => setActive(isShortlisted(snapshot.id, readShortlist()));
    sync();
    window.addEventListener("monkcraft:shortlist", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:shortlist", sync);
      window.removeEventListener("storage", sync);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [snapshot.id]);

  return (
    <>
    <button
      type="button"
      className={[
        "shortlist-btn",
        active ? "shortlist-btn--active" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${snapshot.name} from quote selections`
          : `Add ${snapshot.name} to quote selections`
      }
      onClick={() => {
        try {
          const next = toggleShortlist(snapshot);
          const saved = next.some((item) => item.id === snapshot.id);
          setActive(saved); setFeedback(saved ? 'Added to quote selections' : 'Removed from quote selections'); setError('');
          if(timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setFeedback(null), 5000);
        } catch { setError('Could not save. Please try again.'); }
      }}
    >
      <span aria-hidden="true">{active ? "★" : "☆"}</span>
      <span className="shortlist-btn__label">{active ? "In quote" : "Add to quote"}</span>
    </button>
    {feedback && <span className="save-feedback" role="status">{feedback} <button type="button" onClick={() => {try {if(active) removeFromShortlist(snapshot.id); else addToShortlist(snapshot);setActive(!active);setFeedback(null);} catch {setError('Could not undo. Please try again.');}}}>Undo</button></span>}
    {error && <span className="save-feedback" role="alert">{error}</span>}
    </>
  );
}
