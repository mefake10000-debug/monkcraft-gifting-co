"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BoxProductSnapshot } from "@/data/catalogue/boxTypes";
import {
  addToBox,
  getBoxProductQuantity,
  readBoxDraft,
} from "@/lib/box";

type AddToBoxButtonProps = {
  snapshot: BoxProductSnapshot;
  className?: string;
  /** Compact card style vs detail-page style */
  variant?: "card" | "detail";
};

export function AddToBoxButton({
  snapshot,
  className,
  variant = "card",
}: AddToBoxButtonProps) {
  const [qty, setQty] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const sync = () => {
      const draft = readBoxDraft();
      setQty(getBoxProductQuantity(snapshot.id, draft));
    };
    sync();
    window.addEventListener("monkcraft:box", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:box", sync);
      window.removeEventListener("storage", sync);
    };
  }, [snapshot.id]);

  const active = qty > 0;

  return (
    <div
      className={[
        "add-to-box",
        variant === "detail" ? "add-to-box--detail" : "add-to-box--card",
        active ? "add-to-box--active" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="add-to-box__btn"
        aria-pressed={active}
        onClick={() => {
          if (active) return;
          // Qty-per-box starts at 1. Supplier MOQ is a programme-wide floor,
          // not units stuffed into every kit (audit D01).
          addToBox(snapshot, 1);
          setQty(getBoxProductQuantity(snapshot.id));
          setJustAdded(true);
          window.setTimeout(() => setJustAdded(false), 2500);
        }}
      >
        {active
          ? `In box (${qty}/box)`
          : justAdded
            ? "Added"
            : "Add to Box"}
      </button>
      {active || justAdded ? (
        <Link className="add-to-box__continue" href="/gifts/box">
          {justAdded ? "Added · Continue box" : "Continue box"}
        </Link>
      ) : null}
    </div>
  );
}
