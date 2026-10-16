import type { MetadataRoute } from "next";
import { getAllProducts } from "@/data/catalogue/products";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://monkcraft-gifting-co.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getAllProducts().map((product) => ({
    url: `${siteUrl}/gifts/${product.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const pages = ["", "/gifts", "/gifts/find", "/gifts/box", "/studio", "/company-stores"].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  return [...pages, ...products];
}
