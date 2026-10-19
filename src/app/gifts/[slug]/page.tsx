import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductVariantExperience } from "@/components/catalogue/ProductVariantExperience";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
} from "@/data/catalogue/products";
import { getProductVariantFamily } from "@/data/catalogue/query";
import { truncateMetaDescription } from "@/lib/seoText";
import { buyerProductIntro } from "@/lib/productVoice";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

/** Sample params only — full catalogue is served on demand (4k+ SKUs).
 *  dynamicParams defaults to true; explicit export is incompatible with cacheComponents. */
export async function generateStaticParams() {
  const products = getAllProducts();
  if (products.length === 0) {
    return [{ slug: "__awaiting-inventory__" }];
  }
  // Warm a larger first wave so View / related links feel instant.
  return products.slice(0, 120).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found | Monkcraft" };
  }
  const intro = buyerProductIntro(product.summary, product.name, product.filterCategorySlug || product.categorySlug);
  return {
    title: `${product.name} | Corporate Gift Catalogue | Monkcraft`,
    description: truncateMetaDescription([product.name, intro].join(". ")),
    alternates: { canonical: `/gifts/${product.slug}` },
    openGraph: {
      title: product.name,
      description: intro,
      url: `/gifts/${product.slug}`,
      images: product.images[0] ? [product.images[0].src] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | Monkcraft`,
      description: intro,
      images: product.images[0] ? [product.images[0].src] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://monkcraft-gifting-co.vercel.app';
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: product.name, sku: product.catalogueSku,
    description: buyerProductIntro(product.summary, product.name, product.filterCategorySlug || product.categorySlug),
    ...(product.brandName ? {brand: {'@type':'Brand', name:product.brandName}} : {}),
    ...(product.images.length ? {image: product.images.map(image => new URL(image.src, siteUrl).toString())} : {}),
    url: `${siteUrl}/gifts/${product.slug}`,
  };
  return (
    <main className="catalogue-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')}} />
      <SiteHeader />
      <Suspense
        fallback={
          <section className="product-missing" aria-busy="true">
            <p>Loading product…</p>
          </section>
        }
      >
        <ProductDetailBody product={product} />
      </Suspense>
      <SiteFooter />
    </main>
  );
}

async function ProductDetailBody({
  product,
}: {
  product: NonNullable<ReturnType<typeof getProductBySlug>>;
}) {
  const variantFamily = getProductVariantFamily(product);
  const variantIds = new Set(variantFamily?.options.map((variant) => variant.id) ?? []);
  const related = getRelatedProducts(product, 8).filter((item) => !variantIds.has(item.id)).slice(0, 4);

  return (
    <article className="product-detail">
      <ProductVariantExperience product={product} variantFamily={variantFamily} />

      {related.length > 0 ? (
        <section
          className="product-detail__related"
          aria-labelledby="related-heading"
        >
          <h2 id="related-heading">More good finds</h2>
          <ul className="related-gifts">
            {related.map((item) => {
              const image = item.images[0];
              return (
                <li key={item.id}>
                  <Link
                    href={`/gifts/${item.slug}`}
                    className="related-gift"
                    aria-label={item.name}
                  >
                    <span className="related-gift__media">
                      {image ? (
                        <span className="related-gift__frame">
                          <Image
                            src={image.src}
                            alt=""
                            fill
                            sizes="(max-width: 719px) 45vw, 180px"
                            className="related-gift__image"
                            style={{
                              objectFit: "contain",
                              objectPosition: "center",
                            }}
                          />
                        </span>
                      ) : (
                        <span className="related-gift__media-empty">
                          No image
                        </span>
                      )}
                    </span>
                    <span className="related-gift__title">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
