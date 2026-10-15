"use client";

import { useEffect, useState } from "react";
import type { ShortlistSnapshot } from "@/lib/shortlist";
import {
  isShortlisted,
  readShortlist,
  toggleShortlist,
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

  useEffect(() => {
    const sync = () => setActive(isShortlisted(snapshot.id, readShortlist()));
    sync();
    window.addEventListener("monkcraft:shortlist", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:shortlist", sync);
      window.removeEventListener("storage", sync);
    };
  }, [snapshot.id]);

  return (
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
          ? `Remove ${snapshot.name} from shortlist`
          : `Save ${snapshot.name} to shortlist`
      }
      onClick={() => {
        const next = toggleShortlist(snapshot);
        setActive(next.some((item) => item.id === snapshot.id));
      }}
    >
      <span aria-hidden="true">{active ? "★" : "☆"}</span>
      <span className="shortlist-btn__label">{active ? "Saved" : "Save"}</span>
    </button>
  );
}
