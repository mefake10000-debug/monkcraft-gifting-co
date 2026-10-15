"use client";

import { useEffect, useState } from "react";
import {
  COMPARE_EVENT,
  isCompared,
  MAX_COMPARE,
  readCompare,
  toggleCompare,
  type CompareSnapshot,
} from "@/lib/compare";

type CompareButtonProps = {
  snapshot: CompareSnapshot;
  initiallyCompared?: boolean;
  className?: string;
  /** Icon-only overlay button for product cards. */
  compact?: boolean;
};

export function CompareButton({
  snapshot,
  initiallyCompared = false,
  className,
  compact = false,
}: CompareButtonProps) {
  const [active, setActive] = useState(initiallyCompared);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const sync = () => {
      const list = readCompare();
      setActive(isCompared(snapshot.id, list));
      setFull(list.length >= MAX_COMPARE && !isCompared(snapshot.id, list));
    };
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [snapshot.id]);

  const label = active
    ? `Remove ${snapshot.name} from comparison`
    : full
      ? `Compare list is full (${MAX_COMPARE})`
      : `Add ${snapshot.name} to comparison`;

  return (
    <button
      type="button"
      className={[
        "compare-btn",
        compact ? "compare-btn--compact" : "",
        active ? "compare-btn--active" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-pressed={active}
      aria-label={label}
      title={label}
      disabled={full}
      onClick={() => {
        const next = toggleCompare(snapshot);
        setActive(next.some((item) => item.id === snapshot.id));
      }}
    >
      <span aria-hidden="true">{active ? "✓" : "+"}</span>
      {compact ? null : (
        <span className="compare-btn__label">
          {active ? "In comparison" : full ? "Compare full" : "Compare"}
        </span>
      )}
    </button>
  );
}
