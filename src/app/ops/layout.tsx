import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Operations routes read a signed session cookie at request time. Keep this
// internal area request-rendered instead of trying to prerender it.
export const instant = false;

export default function OperationsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
