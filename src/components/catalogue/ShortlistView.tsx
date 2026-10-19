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
  productMinimumOrderLabel,
  standardProductQuantityFloor,
} from "@/lib/shortlist";

export function ShortlistView() {
  const [items, setItems] = useState<ShortlistItem[]>([]);
  const [ready, setReady] = useState(false);
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({});

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
          <p>Loading your quote selections…</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="journey-panel journey-panel--empty" role="status">
        <p className="journey-eyebrow">QUOTE SELECTIONS</p>
        <h1>Your next good gift starts here.</h1>
        <p>Browse the catalogue and add your picks. We’ll confirm bulk pricing and availability in your quote.</p>
        <div className="journey-actions">
          <Link className="journey-btn" href="/gifts">
            Browse catalogue
          </Link>
        </div>
      </div>
    );
  }

  const units = shortlistTotalUnits(items);

  function commitQuantity(item: ShortlistItem, value: string) {
    const minimum = standardProductQuantityFloor(item.minQuantity);
    const parsed = Math.floor(Number(value));
    const quantity = Number.isFinite(parsed) ? Math.max(minimum, parsed) : minimum;
    setShortlistQuantity(item.id, quantity);
    setQuantityDrafts((current) => ({ ...current, [item.id]: String(quantity) }));
  }

  return (
    <div className="journey-panel">
      <header className="journey-panel__head">
        <div>
          <p className="journey-eyebrow">QUOTE SELECTIONS</p>
          <h1>Your picks. Nearly there.</h1>
          <p>
            {items.length} product{items.length === 1 ? "" : "s"} · {units} total units. Review quantities before requesting a quote.
          </p>
          <p className="cart-price-note">We’ll confirm the prices before you approve. Payment comes after the agreed quote.</p>
        </div>
        <div className="journey-actions">
          <Link className="journey-btn" href="/gifts/brief">
            Review quote request
          </Link>
          <button
            type="button"
            className="journey-btn journey-btn--ghost"
            onClick={() => {
              if (
                window.confirm(
                  "Clear all quote selections? This cannot be undone.",
                )
              ) {
                clearShortlist();
              }
            }}
          >
            Clear selections
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
              <p className="shortlist-row__moq">MOQ {productMinimumOrderLabel(item.minQuantity)}</p>
            </div>
            <div className="shortlist-row__qty">
              <label htmlFor={`qty-${item.id}`}>Quantity (pcs)</label>
              <input
                id={`qty-${item.id}`}
                type="number"
                min={standardProductQuantityFloor(item.minQuantity)}
                step={1}
                value={quantityDrafts[item.id] ?? String(item.quantity)}
                onChange={(event) => setQuantityDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                onBlur={(event) => commitQuantity(item, event.target.value)}
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
        <Link className="journey-btn" href="/gifts/brief">
          Review quote
        </Link>
      </div>
    </div>
  );
}
