import type { ReactNode } from "react";

export function ProductDisclosure({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`product-detail__disclosure ${className}`}>
      <summary>{title}</summary>
      <div className="product-detail__disclosure-content">{children}</div>
    </details>
  );
}
