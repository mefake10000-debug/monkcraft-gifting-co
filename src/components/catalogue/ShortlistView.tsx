"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ShortlistItem } from "@/data/catalogue/types";
import {
  clearShortlist,
  readShortlist,
  removeFromShortlist,
  setShortlistQuantity,
  shortlistTotalUnits,
} from "@/lib/shortlist";

export function ShortlistView() {
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setItems(readShortlist());
      setReady(true);
    };
    sync();
    window.addEventListener("monkcraft:shortlist", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:shortlist", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!ready) {
    return (
      <div className="journey-panel" aria-busy="true">
        <p>Loading your shortlist…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="journey-panel journey-panel--empty" role="status">
        <h1>Your shortlist is empty</h1>
        <p>
          Save products from the catalogue. Selections stay in this browser after
          refresh.
        </p>
        <div className="journey-actions">
          <Link className="journey-btn" href="/gifts">
            Browse gifts
          </Link>
        </div>
      </div>
    );
  }

  const units = shortlistTotalUnits(items);

  return (
    <div className="journey-panel">
      <header className="journey-panel__head">
        <div>
          <p className="journey-eyebrow">Shortlist</p>
          <h1>
            {items.length} product{items.length === 1 ? "" : "s"} · {units}{" "}
            {units === 1 ? "unit" : "units"}
          </h1>
          <p>
            Quantities are saved locally. Adjust them here, then continue to your
            gifting brief.
          </p>
        </div>
        <div className="journey-actions">
          <Link className="journey-btn" href="/gifts/brief">
            Open My Brief
          </Link>
          <Link
            className="journey-btn journey-btn--ghost"
            href="/studio?mode=catalogue&from=shortlist&fromShortlist=1"
          >
            Build white-label catalogue
          </Link>
          <button
            type="button"
            className="journey-btn journey-btn--ghost"
            onClick={() => {
              if (
                window.confirm(
                  "Clear all shortlisted products? This cannot be undone.",
                )
              ) {
                clearShortlist();
              }
            }}
          >
            Clear shortlist
          </button>
        </div>
      </header>

      <ul className="shortlist-list">
        {items.map((item) => (
          <li key={item.id} className="shortlist-row">
            <div className="shortlist-row__media">
              {item.imageSrc ? (
                <Image
                  src={item.imageSrc}
                  alt=""
                  width={96}
                  height={96}
                  className="shortlist-row__image"
                  style={{ objectFit: "contain", objectPosition: "center" }}
                />
              ) : (
                <div className="shortlist-row__placeholder">No image</div>
              )}
            </div>
            <div className="shortlist-row__body">
              <p className="shortlist-row__meta">{item.categoryName}</p>
              <h2>
                <Link href={`/gifts/${item.slug}`}>{item.name}</Link>
              </h2>
              <p className="shortlist-row__price">{item.priceLabel}</p>
              {item.minQuantity ? (
                <p className="shortlist-row__moq">MOQ {item.minQuantity}</p>
              ) : null}
            </div>
            <div className="shortlist-row__qty">
              <label htmlFor={`qty-${item.id}`}>Qty</label>
              <input
                id={`qty-${item.id}`}
                type="number"
                min={item.minQuantity && item.minQuantity > 0 ? item.minQuantity : 1}
                value={item.quantity}
                onChange={(event) =>
                  setShortlistQuantity(item.id, Number(event.target.value))
                }
              />
              <button
                type="button"
                className="shortlist-row__remove"
                onClick={() => removeFromShortlist(item.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="journey-actions journey-actions--footer">
        <Link className="journey-btn journey-btn--ghost" href="/gifts">
          Keep browsing
        </Link>
        <Link
          className="journey-btn journey-btn--ghost"
          href="/studio?mode=catalogue&from=shortlist&fromShortlist=1"
        >
          Studio catalogue
        </Link>
        <Link className="journey-btn" href="/gifts/brief">
          Open My Brief
        </Link>
      </div>
    </div>
  );
}
