import type { ReactNode } from "react";
import "./company-stores.css";

export const metadata = {
  title: "Company Stores | Monkcraft Gifting Co",
  description:
    "Branded company merchandise stores for corporate teams — request a store or draft a proposed store configuration with Monkcraft.",
  alternates: { canonical: "/company-stores" },
  openGraph: {
    type: "website" as const,
    title: "Company Stores | Monkcraft Gifting Co",
    description:
      "A private company gift store lets employees choose from company-approved gifts and credits.",
    url: "/company-stores",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Company Stores | Monkcraft Gifting Co",
    description:
      "A private company gift store lets employees choose from company-approved gifts and credits.",
  },
};

export default function CompanyStoresLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
