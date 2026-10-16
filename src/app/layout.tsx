import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { HashScroll } from "@/components/HashScroll";
import "./globals.css";
import "./experience.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://monkcraft-gifting-co.vercel.app"),
  title: "Monkcraft Gifting Co | Corporate Gifting for Modern Indian Teams",
  description:
    "Premium corporate gifting, custom-branded merchandise, kits & fulfilment, and company stores — curated for modern Indian teams.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <script
          // Enables the scroll-reveal hidden state only when JS runs and the
          // user allows motion. Runs before paint (no flash) and leaves content
          // fully visible when JS is disabled or reduced-motion is set.
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('mc-motion')}}catch(e){}",
          }}
        />
        <HashScroll />
        {children}
      </body>
    </html>
  );
}
