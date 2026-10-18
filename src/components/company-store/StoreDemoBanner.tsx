import Link from "next/link";

export function StoreDemoBanner({
  context = "demo",
  showBackLink = true,
}: {
  context?: "demo" | "preview" | "employee";
  showBackLink?: boolean;
}) {
  const label = context === "employee"
    ? "Employee preview"
    : context === "preview"
      ? "Store preview"
      : "Interactive demo";

  return (
    <aside className="cs-banner" aria-label="Company Store demo status">
      <p className="cs-banner__message">
        <strong>{label}</strong>
        <span> Changes stay in this browser; requests are not submitted.</span>
      </p>
      <details className="cs-banner__limits">
        <summary>Demo limits</summary>
        <p>Authentication, payments, inventory holds, and order submission are not connected.</p>
      </details>
      {context === "employee" && showBackLink ? <Link href="/company-stores">Back to company setup</Link> : null}
    </aside>
  );
}
