import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Store Preview | Monkcraft",
  alternates: { canonical: null },
  robots: { index: false, follow: false },
};

export default function CompanyStorePreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
