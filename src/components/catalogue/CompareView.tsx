"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/catalogue/types";
import {
  COMPARE_EVENT,
  compareSlugs,
  readCompare,
  removeFromCompare,
} from "@/lib/compare";
import { formatGstBasis, formatPricing } from "@/lib/pricing";
import { AddToBoxButton } from "@/components/box/AddToBoxButton";
import { ShortlistButton } from "./ShortlistButton";

type CompareViewProps = {
  products: Product[];
};

export function CompareView({ products }: CompareViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>(products);
  const [prevProducts, setPrevProducts] = useState<Product[]>(products);
  const [fallbackSlugs, setFallbackSlugs] = useState<string[]>([]);

  // Resync when the server sends a new set (deep-link / navigation).
  if (products !== prevProducts) {
    setPrevProducts(products);
    setItems(products);
  }

  // When opened without ?slugs=, fall back to whatever is queued locally.
  useEffect(() => {
    const detect = () => {
      if (products.length > 0) return;
      const stored = readCompare();
      if (stored.length > 0) setFallbackSlugs(stored.map((item) => item.slug));
    };
    detect();
  }, [products]);

  // Keep the table in sync when the tray removes an item.
  useEffect(() => {
    const sync = () => {
      const slugs = new Set(compareSlugs(readCompare()));
      setItems((current) => current.filter((p) => slugs.has(p.slug)));
    };
    window.addEventListener(COMPARE_EVENT, sync);
    return () => window.removeEventListener(COMPARE_EVENT, sync);
  }, []);

  function remove(product: Product) {
    const next = removeFromCompare(product.id).filter((item) => item.slug);
    setItems((current) => current.filter((p) => p.id !== product.id));
    const query = next.length
      ? `?slugs=${encodeURIComponent(next.map((i) => i.slug).join(","))}`
      : "";
    router.replace(`/gifts/compare${query}`);
  }

  const attributeLabels = useMemo(() => {
    const seen: string[] = [];
    for (const product of items) {
      for (const attribute of product.attributes ?? []) {
        if (!seen.includes(attribute.label)) seen.push(attribute.label);
      }
    }
    return seen;
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="journey-panel journey-panel--empty" role="status">
        <h1>Nothing to compare yet</h1>
        <p>
          Add two or more products from the catalogue using the “Compare”
          button, then review them side by side here.
        </p>
        <div className="journey-actions">
          {fallbackSlugs.length > 0 ? (
            <Link
              className="journey-btn"
              href={`/gifts/compare?slugs=${encodeURIComponent(
                fallbackSlugs.join(","),
              )}`}
            >
              Show my {fallbackSlugs.length} selected
            </Link>
          ) : null}
          <Link className="journey-btn journey-btn--ghost" href="/gifts">
            Browse gifts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-view journey-panel">
      <header className="journey-panel__head">
        <div>
          <p className="journey-eyebrow">Compare</p>
          <h1>
            {items.length} product{items.length === 1 ? "" : "s"} side by side
          </h1>
          <p>
            Only verified details from the catalogue are shown. Add up to four
            products to compare branding, timeline, and pricing.
          </p>
        </div>
        <div className="journey-actions">
          <Link className="journey-btn" href="/gifts">
            Add more products
          </Link>
          <Link className="journey-btn journey-btn--ghost" href="/gifts/brief">
            Open My Brief
          </Link>
        </div>
      </header>

      {items.length === 1 ? (
        <p className="compare-view__hint" role="status">
          Add at least one more product to see a full comparison.
        </p>
      ) : null}

      <div className="compare-table-scroll">
        <table className="compare-table">
          <caption className="visually-hidden">
            Side-by-side comparison of selected products
          </caption>
          <thead>
            <tr>
              <th scope="col" className="compare-table__rowhead">
                Product
              </th>
              {items.map((product) => {
                const image = product.images[0];
                return (
                  <th key={product.id} scope="col" className="compare-table__col">
                    <div className="compare-col__media">
                      {image ? (
                        <Image
                          src={image.src}
                          alt=""
                          width={140}
                          height={140}
                          style={{ objectFit: "contain", objectPosition: "center" }}
                        />
                      ) : (
                        <div className="compare-col__placeholder">No image</div>
                      )}
                    </div>
                    <p className="compare-col__cat">
                      {product.filterCategoryName || product.categoryName}
                    </p>
                    <h2 className="compare-col__name">
                      <Link href={`/gifts/${product.slug}`}>{product.name}</Link>
                    </h2>
                    <button
                      type="button"
                      className="compare-col__remove"
                      onClick={() => remove(product)}
                    >
                      Remove
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <CompareRow label="Price">
              {items.map((product) => (
                <td key={product.id}>
                  <span className="compare-table__price">
                    {formatPricing(product.pricing)}
                  </span>
                  {product.pricing.kind === "fixed" &&
                  formatGstBasis(product.pricing.gstBasis) ? (
                    <span className="compare-table__sub">
                      {formatGstBasis(product.pricing.gstBasis)}
                    </span>
                  ) : null}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Minimum order">
              {items.map((product) => (
                <td key={product.id}>
                  {product.minQuantity != null && product.minQuantity > 1
                    ? product.minQuantity.toLocaleString("en-IN")
                    : "—"}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Type">
              {items.map((product) => (
                <td key={product.id}>{product.productTypeLabel || "—"}</td>
              ))}
            </CompareRow>
            <CompareRow label="Category">
              {items.map((product) => (
                <td key={product.id}>
                  {product.filterCategoryName || product.categoryName || "—"}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Colours">
              {items.map((product) => (
                <td key={product.id}>
                  {product.colours.length ? product.colours.join(", ") : "—"}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Materials">
              {items.map((product) => (
                <td key={product.id}>
                  {product.materials.length ? product.materials.join(", ") : "—"}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Branding">
              {items.map((product) => (
                <td key={product.id}>
                  {product.brandingOptions.length
                    ? product.brandingOptions.join(", ")
                    : product.customization || "—"}
                </td>
              ))}
            </CompareRow>
            <CompareRow label="Dispatch">
              {items.map((product) => (
                <td key={product.id}>{product.dispatchTimeline || "—"}</td>
              ))}
            </CompareRow>
            {attributeLabels.map((label) => (
              <CompareRow key={label} label={label}>
                {items.map((product) => {
                  const attribute = product.attributes?.find(
                    (entry) => entry.label === label,
                  );
                  return <td key={product.id}>{attribute?.value || "—"}</td>;
                })}
              </CompareRow>
            ))}
            <CompareRow label="Actions">
              {items.map((product) => (
                <td key={product.id}>
                  <div className="compare-col__actions">
                    <ShortlistButton
                      snapshot={{
                        id: product.id,
                        slug: product.slug,
                        name: product.name,
                        imageSrc: product.images[0]?.src,
                        priceLabel: formatPricing(product.pricing),
                        minQuantity: product.minQuantity,
                        categoryName:
                          product.filterCategoryName || product.categoryName,
                      }}
                    />
                    <AddToBoxButton
                      variant="card"
                      snapshot={{
                        id: product.id,
                        slug: product.slug,
                        name: product.name,
                        imageSrc: product.images[0]?.src,
                        priceLabel: formatPricing(product.pricing),
                        minQuantity: product.minQuantity,
                        categoryName:
                          product.filterCategoryName || product.categoryName,
                        amountInr:
                          product.pricing.kind === "fixed"
                            ? product.pricing.amountInr
                            : undefined,
                      }}
                    />
                  </div>
                </td>
              ))}
            </CompareRow>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <th scope="row" className="compare-table__rowhead">
        {label}
      </th>
      {children}
    </tr>
  );
}
