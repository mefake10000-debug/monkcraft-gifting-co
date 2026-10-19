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
      <p className="catalogue-empty__eyebrow">Let’s find your match</p>
      <h2 className="catalogue-empty__title">
        {hasActiveFilters
          ? "No matches this time"
          : "The gifts aren’t loading"}
      </h2>
      <p className="catalogue-empty__text">
        {hasActiveFilters
          ? "Try fewer filters or a different search. Gift Finder can help you find a starting point."
          : "Refresh the page to try again, or tell us what you’re looking for and we’ll help."}
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
          Talk gifting with us
        </Link>
      </div>

      <div className="catalogue-empty__ideas">
        <p className="catalogue-empty__ideas-label">Start with the moment</p>
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
