import Link from "next/link";
import { giftCategories } from "@/data/giftCategories";

type CatalogueEmptyProps = {
  hasActiveFilters: boolean;
  onClearHref: string;
};

export function CatalogueEmpty({
  hasActiveFilters,
  onClearHref,
}: CatalogueEmptyProps) {
  return (
    <div className="catalogue-empty" role="status">
      <p className="catalogue-empty__eyebrow">Catalogue status</p>
      <h2 className="catalogue-empty__title">
        {hasActiveFilters
          ? "No matching products"
          : "No products to show"}
      </h2>
      <p className="catalogue-empty__text">
        {hasActiveFilters
          ? "No verified products match this combination. Clear filters or start a consultation with your brief."
          : "The catalogue could not load products from the export. Check that the website-export data symlink is available, or start a consultation."}
      </p>

      <div className="catalogue-empty__actions">
        {hasActiveFilters ? (
          <Link className="mc-btn mc-btn--ghost mc-btn--small" href={onClearHref}>
            Clear filters
          </Link>
        ) : null}
        <Link className="mc-btn mc-btn--primary mc-btn--small" href="/gifts/find">
          Try Gift Finder
        </Link>
        <Link className="mc-btn mc-btn--subtle mc-btn--small" href="/#enquire">
          Start a consultation
        </Link>
      </div>

      <div className="catalogue-empty__ideas">
        <p className="catalogue-empty__ideas-label">Browse by gifting moment</p>
        <ul>
          {giftCategories.map((category) => (
            <li key={category.id}>
              <Link href={category.cataloguePath ?? `/gifts?occasion=${category.id}`}>
                {category.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
