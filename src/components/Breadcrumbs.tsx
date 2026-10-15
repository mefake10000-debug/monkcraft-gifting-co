import Link from "next/link";

export type Crumb = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: Crumb[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      className={["mc-breadcrumbs", className].filter(Boolean).join(" ")}
      aria-label="Breadcrumb"
    >
      <ol className="mc-breadcrumbs__list">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="mc-breadcrumbs__item">
              {index > 0 ? (
                <span className="mc-breadcrumbs__sep" aria-hidden="true">
                  /
                </span>
              ) : null}
              {last || !item.href ? (
                <span
                  className="mc-breadcrumbs__current"
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link className="mc-breadcrumbs__link" href={item.href}>
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
