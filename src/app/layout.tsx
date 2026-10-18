import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { HashScroll } from "@/components/HashScroll";
import { AttributionCapture } from "@/components/AttributionCapture";
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
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Monkcraft Gifting Co",
    title: "Monkcraft Gifting Co | Corporate Gifting for Modern Indian Teams",
    description:
      "Premium corporate gifting, custom-branded merchandise, kits & fulfilment, and company stores — curated for modern Indian teams.",
    images: [
      {
        url: "/hero/monkcraft-hero-landing-poster.jpg",
        width: 1920,
        height: 1080,
        alt: "Monkcraft corporate gifting for modern teams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Monkcraft Gifting Co | Corporate Gifting for Modern Indian Teams",
    description:
      "Premium corporate gifting, custom-branded merchandise, kits & fulfilment, and company stores — curated for modern Indian teams.",
    images: ["/hero/monkcraft-hero-landing-poster.jpg"],
  },
};

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://monkcraft-gifting-co.vercel.app";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Monkcraft Gifting Co",
  url: publicSiteUrl,
  logo: new URL("/brand/Monkcraft-Black-Horizontal.png", publicSiteUrl).toString(),
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
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
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
        <AttributionCapture />
        {children}
      </body>
    </html>
  );
}
