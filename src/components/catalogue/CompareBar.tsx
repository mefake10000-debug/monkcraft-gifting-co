"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearCompare,
  COMPARE_EVENT,
  readCompare,
  removeFromCompare,
  type CompareItem,
} from "@/lib/compare";

/**
 * Floating comparison tray. Appears across the catalogue + PDP once at least
 * one product is queued for comparison. Limits and persistence live in
 * `@/lib/compare`.
 */
export function CompareBar() {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readCompare());
    sync();
    window.addEventListener(COMPARE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(COMPARE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (items.length === 0) return null;

  const slugs = items.map((item) => item.slug).join(",");

  return (
    <div className="compare-bar" role="region" aria-label="Comparison tray">
      <div className="compare-bar__inner">
        <ul className="compare-bar__thumbs">
          {items.map((item) => (
            <li key={item.id} className="compare-bar__thumb">
              <span className="compare-bar__thumb-media">
                {item.imageSrc ? (
                  <Image
                    src={item.imageSrc}
                    alt=""
                    width={44}
                    height={44}
                    style={{ objectFit: "contain", objectPosition: "center" }}
                  />
                ) : (
                  <span aria-hidden="true">{item.name.slice(0, 1)}</span>
                )}
              </span>
              <button
                type="button"
                className="compare-bar__remove"
                aria-label={`Remove ${item.name} from comparison`}
                onClick={() => removeFromCompare(item.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        <div className="compare-bar__actions">
          <button
            type="button"
            className="compare-bar__clear"
            onClick={() => clearCompare()}
          >
            Clear
          </button>
          {items.length >= 2 ? (
            <Link
              className="compare-bar__cta"
              href={`/gifts/compare?slugs=${encodeURIComponent(slugs)}`}
            >
              Compare {items.length}
            </Link>
          ) : (
            <span className="compare-bar__hint">Add one more to compare</span>
          )}
        </div>
      </div>
    </div>
  );
}
