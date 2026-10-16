import { Suspense } from "react";
import { EmployeeProductDetail } from "@/components/company-store/EmployeeProductDetail";

/** Dynamic slug; opt out of instant-navigation validation (Next.js Cache Components). */
export const instant = false;

type Props = {
  params: Promise<{ slug: string }>;
};

export default function CompanyStoreProductPreviewPage({ params }: Props) {
  return (
    <>
      <Suspense
        fallback={
          <div className="cs-storefront">
            <p style={{ padding: "2rem" }}>Loading product preview…</p>
          </div>
        }
      >
        <PreviewBody params={params} />
      </Suspense>
    </>
  );
}

async function PreviewBody({ params }: Props) {
  const { slug } = await params;
  return <EmployeeProductDetail slug={slug} />;
}
