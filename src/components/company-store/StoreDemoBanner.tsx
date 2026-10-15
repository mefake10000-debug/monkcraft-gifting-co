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
        Local browser draft only. No live auth, payments, inventory holds, or
        real order submission.
      </p>
      <Link href="/company-stores">About Company Stores</Link>
    </div>
  );
}
