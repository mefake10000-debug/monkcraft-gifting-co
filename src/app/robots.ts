import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://monkcraft-gifting-co.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/gifts/brief", "/gifts/compare"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
