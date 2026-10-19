"use client";

import Link from "next/link";
import { useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AddToBoxButton } from "@/components/box/AddToBoxButton";
import { ProductDisclosure } from "@/components/catalogue/ProductDisclosure";
import { ProductGallery } from "@/components/catalogue/ProductGallery";
import { ShortlistButton } from "@/components/catalogue/ShortlistButton";
import { FavouriteButton } from "@/components/catalogue/FavouriteButton";
import { BackToResults } from "@/components/catalogue/BackToResults";
import type { Product } from "@/data/catalogue/types";
import { formatGstBasis, formatPricing } from "@/lib/pricing";
import { productToBoxSnapshot, productToSnapshot } from "@/lib/productSnapshots";
import { productMinimumOrderLabel } from "@/lib/shortlist";
import type { ProductVariantFamily } from "@/data/catalogue/query";
import { getProductSizeGuide } from "@/data/catalogue/productGuides";
import { getReviewedBundleContents, getReviewedProductDescription } from "@/data/catalogue/editorial/runtime";
import { buyerProductIntro, productMoodLine } from "@/lib/productVoice";

export function ProductVariantExperience({ product: initialProduct, variantFamily }: { product: Product; variantFamily: ProductVariantFamily | null }) {
  const selectedInitialProduct = variantFamily?.options.find((option) => option.id === initialProduct.id) ?? initialProduct;
  const [product, setProduct] = useState<Product>({
    ...selectedInitialProduct,
    colourFamilyCode: variantFamily?.type === "colour" ? variantFamily.code : selectedInitialProduct.colourFamilyCode,
    designFamilyCode: variantFamily?.type === "design" ? variantFamily.code : selectedInitialProduct.designFamilyCode,
    designFamilyName: variantFamily?.type === "design" ? variantFamily.name : selectedInitialProduct.designFamilyName,
    designFamilyOptionLabel: variantFamily?.type === "design" ? variantFamily.optionLabel : selectedInitialProduct.designFamilyOptionLabel,
  });
  const outOfStock = product.availabilityStatus === "OUT";
  const sizeGuide = getProductSizeGuide(product);
  const reviewedBundleContents = getReviewedBundleContents(product.id);
  const hasReviewedDescription = Boolean(getReviewedProductDescription(product.id));
  const intro = buyerProductIntro(product.summary, product.name, product.filterCategorySlug || product.categorySlug);

  return (
    <>
      <BackToResults />
      <Breadcrumbs className="product-detail__crumbs" items={[
        { label: "Home", href: "/" },
        { label: "Catalogue", href: "/gifts" },
        ...(product.filterCategorySlug ? [{ label: product.filterCategoryName || product.filterCategorySlug, href: `/gifts?category=${encodeURIComponent(product.filterCategorySlug)}` }] : []),
        { label: product.name },
      ]} />

      <div className="product-detail__layout">
        <ProductGallery
          key={product.id}
          images={product.images}
          productName={product.name}
          selectedVariantId={product.id}
          colourVariants={variantFamily?.type === "colour" ? variantFamily.options : []}
          designVariants={variantFamily?.type === "design" ? variantFamily.options : []}
          designVariantLabel={variantFamily?.type === "design" ? variantFamily.optionLabel : undefined}
          onSelectVariant={setProduct}
        />

        <div className="product-detail__info">
          <p className="product-detail__type">{intro === product.summary ? productMoodLine(product.filterCategorySlug || product.categorySlug) : product.filterCategoryName}</p>
          <h1>{product.name}</h1>
          {product.catalogueSku ? <p className="product-detail__sku">SKU {product.catalogueSku}</p> : null}
          <p className="product-detail__summary" aria-live="polite">{intro}</p>
          <p className="product-detail__price">
            {formatPricing(product.pricing)}
            {product.pricing.kind === "fixed" && formatGstBasis(product.pricing.gstBasis) ? <span className="product-detail__gst"> · {formatGstBasis(product.pricing.gstBasis)}</span> : null}
          </p>
          <p className="product-detail__price-note">Like it? Add it to your quote. We’ll confirm bulk pricing and availability.</p>
          <p className="product-detail__moq">Minimum order quantity: {productMinimumOrderLabel(product.minQuantity)}</p>
          {sizeGuide ? (
            <p className="product-detail__size-guide">
              <a href={sizeGuide.href} target="_blank" rel="noreferrer">
                {sizeGuide.label} <span aria-hidden="true">↗</span>
              </a>
            </p>
          ) : null}
          {outOfStock ? <p className="product-detail__stock">Currently marked out of stock</p> : null}

          <div className="product-detail__actions">
            <ShortlistButton snapshot={productToSnapshot(product)} />
            <FavouriteButton id={product.id} name={product.name} />
            <AddToBoxButton snapshot={productToBoxSnapshot(product)} variant="detail" />
            <Link className="product-detail__studio" href={`/studio?mode=customize&product=${encodeURIComponent(product.slug)}&from=product`}>Make it yours in Studio</Link>
            <Link className="product-detail__quote" href="/gifts/brief">Open My Brief</Link>
          </div>

          {product.description && !hasReviewedDescription && product.description.trim().toLowerCase() !== product.summary.trim().toLowerCase() ? (
            <ProductDisclosure title="Meet the product" className="product-detail__description-panel"><p className="product-detail__description">{product.description}</p></ProductDisclosure>
          ) : null}
          {product.attributes.length > 0 ? (
            <ProductDisclosure title="Specifications" className="product-detail__specs"><dl>{product.attributes.map((item) => <div key={`${item.label}-${item.value}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></ProductDisclosure>
          ) : null}
          {product.customization ? <ProductDisclosure title="Branding options" className="product-detail__branding"><ul><li>{product.customization}</li></ul></ProductDisclosure> : null}
          {/hamper|gift set|gift box|\bkit\b/i.test(product.name) ? (
            <section className="product-detail__contents" aria-labelledby="bundle-contents-heading">
              <h2 id="bundle-contents-heading">What’s inside</h2>
              {reviewedBundleContents.length > 0
                ? <><p>The catalogue lists these items:</p><ul>{reviewedBundleContents.map((item) => <li key={item}>{item}</li>)}</ul></>
                : product.attributes.filter(item => /inclusion|contents|^item\s*\d|notebook|candle|greeting card|pot material|type of flowers/i.test(item.label)).length > 0
                  ? <ul>{product.attributes.filter(item => /inclusion|contents|^item\s*\d|notebook|candle|greeting card|pot material|type of flowers/i.test(item.label)).map(item => <li key={`${item.label}-${item.value}`}><strong>{item.label}:</strong> {item.value}</li>)}</ul>
                : <p>We’ll confirm the exact contents with your quote. Add this gift to your picks to ask us.</p>}
            </section>
          ) : null}
        </div>
      </div>
    </>
  );
}
