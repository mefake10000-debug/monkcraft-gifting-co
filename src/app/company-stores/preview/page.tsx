import { Suspense } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { EmployeeStorefront } from "@/components/company-store/EmployeeStorefront";

export default function CompanyStorePreviewPage() {
  return (
    <>
      <Suspense fallback={<p style={{ padding: "2rem" }}>Loading store preview…</p>}>
        <EmployeeStorefront />
      </Suspense>
      <SiteFooter />
    </>
  );
}
