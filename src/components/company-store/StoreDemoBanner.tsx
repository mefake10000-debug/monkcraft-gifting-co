import Link from "next/link";

export function StoreDemoBanner({
  context = "demo",
  showBackLink = true,
}: {
  context?: "demo" | "preview" | "employee";
  showBackLink?: boolean;
}) {
  const content = context === "employee"
    ? {
        label: "Employee store preview",
        title: "Preview the employee shopping experience",
        description: "Browse approved gifts and see how a request would look for your team.",
        note: "Preview only. Nothing is sent to a live store.",
      }
    : context === "preview"
      ? {
          label: "Company Store preview",
          title: "Review your proposed company store",
          description: "Check the selected gifts, store identity and employee experience.",
          note: "This is a preview. No live orders are created.",
        }
      : {
          label: "Interactive company demo",
          title: "Set up a store and preview the team experience",
          description: "Choose gifts, set programme rules and see the employee storefront.",
          note: "Your draft stays in this browser. No live orders are created.",
        };

  return (
    <aside className="cs-banner" aria-label="Company Store demo status">
      <div className="cs-banner__intro">
        <div className="cs-banner__meta">
          <span className="cs-banner__label">{content.label}</span>
          <span className="cs-banner__badge">Preview only</span>
        </div>
        <h2>{content.title}</h2>
        <p className="cs-banner__description">{content.description}</p>
        <p className="cs-banner__note">{content.note}</p>
      </div>
      <div className="cs-banner__limits" aria-label="Demo limitations">
        <p className="cs-banner__limits-title">Not connected yet</p>
        <ul>
          <li>Employee sign-in</li>
          <li>Live credits, stock and order processing</li>
        </ul>
      </div>
      {context === "employee" && showBackLink ? (
        <Link className="cs-banner__back" href="/company-stores">Back to company setup</Link>
      ) : null}
    </aside>
  );
}
