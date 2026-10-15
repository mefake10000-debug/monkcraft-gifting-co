import type { ReactNode } from "react";
import "./company-stores.css";

export const metadata = {
  title: "Company Stores | Monkcraft Gifting Co",
  description:
    "Branded company merchandise stores for corporate teams — request a store or draft a proposed store configuration with Monkcraft.",
};

export default function CompanyStoresLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
