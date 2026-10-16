import Link from "next/link";

export function StoreDemoBanner({
  context = "demo",
}: {
  context?: "demo" | "preview" | "employee";
}) {
  const label =
    context === "employee"
      ? "EMPLOYEE PREVIEW / DEMO"
      : context === "preview"
        ? "PREVIEW / DEMO"
        : "DEMO / NOT LIVE";

  return (
    <div className="cs-banner" role="status">
      <p>
        <strong>{label}</strong>
        {" — "}
        {context === "employee"
          ? "No live accounts, credit deductions, or shipments."
          : "Preview only. No live accounts, credit deductions, inventory, or shipments."}
      </p>
      {context !== "employee" ? <Link href="/company-stores">About Company Stores</Link> : null}
    </div>
  );
}
