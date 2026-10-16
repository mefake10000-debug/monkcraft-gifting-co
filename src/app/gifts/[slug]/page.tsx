import { ProductDisclosure } from "@/components/catalogue/ProductDisclosure";
import { BackToResults } from "@/components/catalogue/BackToResults";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AddToBoxButton } from "@/components/box/AddToBoxButton";
import { productToBoxSnapshot, productToSnapshot } from "@/lib/productSnapshots";
import { FavouriteButton } from "@/components/catalogue/FavouriteButton";
import { ProductGallery } from "@/components/catalogue/ProductGallery";
import { ShortlistButton } from "@/components/catalogue/ShortlistButton";
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
} from "@/data/catalogue/products";
import { getColourVariants } from "@/data/catalogue/query";
import { formatGstBasis, formatPricing } from "@/lib/pricing";

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
  return {
    title: `${product.name} | Corporate Gift Catalog | Monkcraft`,
    description: `${product.name}. ${product.summary}`.slice(0, 160),
    alternates: { canonical: `/gifts/${product.slug}` },
    openGraph: { title: product.name, description: product.summary, images: product.images[0] ? [product.images[0].src] : undefined },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://monkcraft-gifting-co.vercel.app';
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: product.name, sku: product.sku,
    description: product.description || product.summary,
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
  const related = getRelatedProducts(product, 4);
  const colourVariants = getColourVariants(product);
  const outOfStock = product.availabilityStatus === "OUT";

  return (
    <article className="product-detail">
      <BackToResults />
      <Breadcrumbs
        className="product-detail__crumbs"
        items={[
          { label: "Home", href: "/" },
          { label: "Catalogs", href: "/gifts" },
          ...(product.filterCategorySlug
            ? [
                {
                  label:
                    product.filterCategoryName || product.filterCategorySlug,
                  href: `/gifts?category=${encodeURIComponent(product.filterCategorySlug)}`,
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      <div className="product-detail__layout">
        <ProductGallery
          key={product.slug}
          images={product.images}
          productName={product.name}
          colourOptions={product.colourOptions}
        />

        <div className="product-detail__info">
          <p className="product-detail__type">
            {product.filterCategoryName}
            {product.subcategoryName ? ` · ${product.subcategoryName}` : ""}
          </p>
          <h1>{product.name}</h1>
          {product.sku ? (
            <p className="product-detail__sku">SKU {product.sku}</p>
          ) : null}
          <p className="product-detail__summary">{product.summary}</p>
          {colourVariants.length > 1 ? <div className="product-detail__variants" aria-label="Available colours"><strong>Choose a colour</strong><div>{colourVariants.map(variant => <Link key={variant.id} href={`/gifts/${variant.slug}`} aria-current={variant.id === product.id ? 'page' : undefined}>{variant.colours[0]}</Link>)}</div></div> : null}
          <p className="product-detail__price">
            {formatPricing(product.pricing)}
            {product.pricing.kind === "fixed" &&
            formatGstBasis(product.pricing.gstBasis) ? (
              <span className="product-detail__gst">
                {" "}
                · {formatGstBasis(product.pricing.gstBasis)}
              </span>
            ) : null}
          </p>
          <p className="product-detail__price-note">
            Displayed price is indicative. Send this product in your cart for Monkcraft to verify and approve the final price.
          </p>
          {product.minQuantity ? (
            <p className="product-detail__moq">
              Minimum order quantity: {product.minQuantity}
            </p>
          ) : null}
          {product.dispatchTimeline ? (
            <p className="product-detail__moq">
              Dispatch: {product.dispatchTimeline}
            </p>
          ) : null}
          {outOfStock ? (
            <p className="product-detail__stock">Currently marked out of stock</p>
          ) : null}

          <div className="product-detail__actions">
            <ShortlistButton snapshot={productToSnapshot(product)} />
            <FavouriteButton id={product.id} name={product.name} />
            <AddToBoxButton
              snapshot={productToBoxSnapshot(product)}
              variant="detail"
            />
            <Link
              className="product-detail__studio"
              href={`/studio?mode=customize&product=${encodeURIComponent(product.slug)}&from=product`}
            >
              Customize in Studio
            </Link>
            <Link className="product-detail__quote" href="/gifts/brief">
              Open My Brief
            </Link>
          </div>
          {product.description &&
          product.description.trim().toLowerCase() !==
            product.summary.trim().toLowerCase() ? (
            <ProductDisclosure title="About this product" className="product-detail__description-panel">
              <p className="product-detail__description">{product.description}</p>
            </ProductDisclosure>
          ) : null}

          {product.attributes.length > 0 ? (
            <ProductDisclosure title="Specifications" className="product-detail__specs">
              <dl>
                {product.attributes.map((item) => (
                  <div key={`${item.label}-${item.value}`}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </ProductDisclosure>
          ) : null}

          {product.customization ? (
            <ProductDisclosure title="Branding options" className="product-detail__branding">
              <ul>
                <li>{product.customization}</li>
              </ul>
            </ProductDisclosure>
          ) : null}

          {/hamper|gift set|gift box|\bkit\b/i.test(product.name) ? (
            <section className="product-detail__contents" aria-labelledby="bundle-contents-heading">
              <h2 id="bundle-contents-heading">What is included</h2>
              {product.attributes.filter(item => /inclusion|contents|^item\s*\d|notebook|candle|greeting card|pot material|type of flowers/i.test(item.label)).length > 0 ?
                <ul>{product.attributes.filter(item => /inclusion|contents|^item\s*\d|notebook|candle|greeting card|pot material|type of flowers/i.test(item.label)).map(item => <li key={`${item.label}-${item.value}`}><strong>{item.label}:</strong> {item.value}</li>)}</ul> :
                <p>The exact contents are not confirmed in this catalogue record. Add it to your cart and Monkcraft will confirm every included item before approval.</p>}
            </section>
          ) : null}


        </div>
      </div>

      {related.length > 0 ? (
        <section
          className="product-detail__related"
          aria-labelledby="related-heading"
        >
          <h2 id="related-heading">Related gifts</h2>
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
