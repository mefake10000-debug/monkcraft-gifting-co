import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { AddToBoxButton } from "@/components/box/AddToBoxButton";
import {
  productToBoxSnapshot,
  productToSnapshot,
} from "@/components/catalogue/ProductCard";
import { ProductGallery } from "@/components/catalogue/ProductGallery";
import { ShortlistButton } from "@/components/catalogue/ShortlistButton";
import {
  getAllProducts,
  getProductBySlug,
  getRelatedProducts,
} from "@/data/catalogue/products";
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
    title: `${product.name} | Monkcraft Gifts`,
    description: product.summary,
  };
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  return (
    <main className="catalogue-page">
      <SiteHeader />
      <Suspense
        fallback={
          <section className="product-missing" aria-busy="true">
            <p>Loading product…</p>
          </section>
        }
      >
        <ProductDetailBody params={params} />
      </Suspense>
      <SiteFooter />
    </main>
  );
}

async function ProductDetailBody({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return (
      <section className="product-missing">
        <p className="product-missing__eyebrow">Product detail</p>
        <h1>This product is not in the catalogue yet</h1>
        <p>
          No verified product exists for <code>{slug}</code>. Browse the live
          catalogue or request a curated quotation.
        </p>
        <div className="product-missing__actions">
          <Link href="/gifts">Back to gifts</Link>
          <Link href="/gifts/brief">Open My Brief</Link>
        </div>
      </section>
    );
  }

  const related = getRelatedProducts(product, 4);
  const outOfStock = product.availabilityStatus === "OUT";

  return (
    <article className="product-detail">
      <Breadcrumbs
        className="product-detail__crumbs"
        items={[
          { label: "Home", href: "/" },
          { label: "Gifts", href: "/gifts" },
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

          {product.description &&
          product.description.trim().toLowerCase() !==
            product.summary.trim().toLowerCase() ? (
            <p className="product-detail__description">{product.description}</p>
          ) : null}

          {product.attributes.length > 0 ? (
            <div className="product-detail__specs">
              <h2>Specifications</h2>
              <dl>
                {product.attributes.map((item) => (
                  <div key={`${item.label}-${item.value}`}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {product.customization ? (
            <div className="product-detail__branding">
              <h2>Branding</h2>
              <ul>
                <li>{product.customization}</li>
              </ul>
            </div>
          ) : null}

          <div className="product-detail__actions">
            <ShortlistButton snapshot={productToSnapshot(product)} />
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
