"use client";

import type {
  StudioProductSummary,
  WhiteLabelCatalogueDraft,
} from "@/data/catalogue/studioTypes";
import { computeDisplayedPrice } from "@/lib/studio/displayPrice";

type CataloguePrintDocumentProps = {
  draft: WhiteLabelCatalogueDraft;
  products: StudioProductSummary[];
};

/** Products per content page — tuned to avoid mid-card page breaks. */
const PRODUCTS_PER_PAGE = 4;

export function CataloguePrintDocument({
  draft,
  products,
}: CataloguePrintDocumentProps) {
  const pages: StudioProductSummary[][] = [];
  for (let i = 0; i < products.length; i += PRODUCTS_PER_PAGE) {
    pages.push(products.slice(i, i + PRODUCTS_PER_PAGE));
  }

  const totalPages = 1 + pages.length;
  const accent = draft.accentColor || "#662F90";

  return (
    <div
      className="studio-print"
      style={{ ["--studio-accent" as string]: accent }}
    >
      <article className="studio-print__page studio-print__page--cover">
        <div className="studio-print__cover-brand">
          {draft.logo?.dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.logo.dataUrl} alt="" className="studio-print__logo" />
          ) : null}
          {draft.companyName ? (
            <p className="studio-print__company">{draft.companyName}</p>
          ) : (
            <p className="studio-print__company studio-print__company--muted">
              Prepared selection
            </p>
          )}
        </div>
        <h1 className="studio-print__title">{draft.title || "Gift catalogue"}</h1>
        {draft.coverText ? (
          <p className="studio-print__cover-text">{draft.coverText}</p>
        ) : null}
        <p className="studio-print__count">
          {products.length} product{products.length === 1 ? "" : "s"}
        </p>
        {(draft.contactName || draft.contactEmail || draft.contactPhone) && (
          <footer className="studio-print__contact">
            {draft.contactName ? <p>{draft.contactName}</p> : null}
            {draft.contactEmail ? <p>{draft.contactEmail}</p> : null}
            {draft.contactPhone ? <p>{draft.contactPhone}</p> : null}
          </footer>
        )}
        {draft.watermark ? (
          <p className="studio-print__watermark" aria-hidden="true">
            {draft.watermark}
          </p>
        ) : null}
        {draft.showPageNumbers ? (
          <p className="studio-print__page-num">1 / {totalPages}</p>
        ) : null}
        <p className="studio-print__disclaimer">
          Product information from the Monkcraft catalogue. Pricing display (if
          shown) is based on verified catalogue unit prices only — taxes,
          branding, and shipping are confirmed separately. This document does
          not imply Monkcraft endorsement of the preparing company unless stated
          by the preparer.
        </p>
      </article>

      {pages.map((pageProducts, pageIndex) => (
        <article
          key={`page-${pageIndex}`}
          className="studio-print__page studio-print__page--products"
        >
          <header className="studio-print__page-head">
            <p>{draft.companyName || draft.title}</p>
            {draft.watermark ? (
              <p className="studio-print__page-watermark">{draft.watermark}</p>
            ) : null}
          </header>
          <ul className="studio-print__grid">
            {pageProducts.map((product) => {
              const price = computeDisplayedPrice(
                product.amountInr,
                draft.pricingMode,
                draft.markupValue,
              );
              return (
                <li key={product.id} className="studio-print__card">
                  {draft.fields.image ? (
                    <div className="studio-print__card-media">
                      {product.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageSrc}
                          alt={product.imageAlt || product.name}
                        />
                      ) : (
                        <span>No image</span>
                      )}
                    </div>
                  ) : null}
                  <div className="studio-print__card-body">
                    {draft.fields.name ? (
                      <h2>{product.name}</h2>
                    ) : null}
                    {draft.fields.category && product.categoryName ? (
                      <p className="studio-print__meta">
                        {product.categoryName}
                        {product.subcategoryName
                          ? ` · ${product.subcategoryName}`
                          : ""}
                      </p>
                    ) : null}
                    {draft.fields.sku && product.catalogueSku ? (
                      <p className="studio-print__meta">SKU {product.catalogueSku}</p>
                    ) : null}
                    {draft.fields.summary && product.summary ? (
                      <p className="studio-print__summary">{product.summary}</p>
                    ) : null}
                    {draft.fields.specs && product.attributes.length > 0 ? (
                      <dl className="studio-print__specs">
                        {product.attributes.slice(0, 4).map((row) => (
                          <div key={`${row.label}-${row.value}`}>
                            <dt>{row.label}</dt>
                            <dd>{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                    {draft.fields.price && price.kind !== "hidden" ? (
                      <p className="studio-print__price">{price.label}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
          {draft.showPageNumbers ? (
            <p className="studio-print__page-num">
              {pageIndex + 2} / {totalPages}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}
