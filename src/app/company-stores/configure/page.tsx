import { Suspense } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StoreAdminShell } from "@/components/company-store/StoreAdminShell";

export default function CompanyStoreConfigurePage() {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <div className="cs-page">
            <div className="cs-admin">
              <p className="mc-loading">
                <span className="mc-loading__dot" aria-hidden="true" />
                Loading configurator…
              </p>
            </div>
          </div>
        }
      >
        <StoreAdminShell />
      </Suspense>
      <SiteFooter />
    </>
  );
}
