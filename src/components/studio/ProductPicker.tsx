"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";

type ProductPickerProps = {
  mode: "single" | "multi";
  selectedIds: string[];
  onSelect: (product: StudioProductSummary) => void;
  onRemove?: (productId: string) => void;
  heading?: string;
  emptyHint?: string;
};

export function ProductPicker({
  mode,
  selectedIds,
  onSelect,
  onRemove,
  heading = "Find a product",
  emptyHint = "Search the live Monkcraft catalogue by name, SKU, or category.",
}: ProductPickerProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudioProductSummary[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setStatus("loading");
      setError("");
      try {
        const products = await fetchStudioProducts({
          q: query.trim() || undefined,
          limit: 20,
          signal: controller.signal,
        });
        setResults(products);
        setStatus("idle");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Could not search the catalogue.",
        );
      }
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [query]);

  return (
    <div className="studio-picker">
      <div className="studio-picker__head">
        <label htmlFor={inputId}>
          <span className="studio-picker__label">{heading}</span>
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, SKU, category…"
            autoComplete="off"
          />
        </label>
        <p className="studio-picker__hint">{emptyHint}</p>
      </div>

      {status === "loading" ? (
        <p className="studio-picker__status" aria-live="polite">
          Searching catalogue…
        </p>
      ) : null}
      {error ? (
        <p className="studio-picker__error" role="alert">
          {error}
        </p>
      ) : null}

      {results.length === 0 && status === "idle" ? (
        <p className="studio-picker__status" role="status">
          {query.trim()
            ? "No products matched. Try another search."
            : "Start typing to search the live catalogue."}
        </p>
      ) : (
        <ul className="studio-picker__list" aria-label="Search results">
          {results.map((product) => {
            const selected = selectedIds.includes(product.id);
            return (
              <li key={product.id}>
                <button
                  type="button"
                  className={
                    selected
                      ? "studio-picker__item studio-picker__item--selected"
                      : "studio-picker__item"
                  }
                  aria-pressed={selected}
                  onClick={() => {
                    if (mode === "multi" && selected && onRemove) {
                      onRemove(product.id);
                      return;
                    }
                    onSelect(product);
                  }}
                >
                  <span className="studio-picker__media">
                    {product.imageSrc ? (
                      <Image
                        src={product.imageSrc}
                        alt=""
                        width={56}
                        height={56}
                      />
                    ) : (
                      <span className="studio-picker__media-empty">No image</span>
                    )}
                  </span>
                  <span className="studio-picker__copy">
                    <span className="studio-picker__name">{product.name}</span>
                    <span className="studio-picker__meta">
                      {product.categoryName}
                      {product.sku ? ` · ${product.sku}` : ""}
                    </span>
                    <span className="studio-picker__price">
                      {product.priceLabel}
                    </span>
                  </span>
                  <span className="studio-picker__action">
                    {mode === "multi"
                      ? selected
                        ? "Remove"
                        : "Add"
                      : selected
                        ? "Selected"
                        : "Use"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
