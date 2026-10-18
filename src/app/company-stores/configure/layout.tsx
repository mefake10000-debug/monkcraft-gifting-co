import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configure a Company Store | Monkcraft",
  alternates: { canonical: null },
  robots: { index: false, follow: false },
};

export default function CompanyStoreConfigureLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
