"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";
import { FAVOURITES_EVENT, readFavouriteIds, toggleFavourite } from "@/lib/favourites";

export function FavouritesView() {
  const [ids, setIds] = useState<string[]>([]);
  const [products, setProducts] = useState<StudioProductSummary[]>([]);
  useEffect(() => {
    const sync = () => setIds(readFavouriteIds());
    sync();
    window.addEventListener(FAVOURITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(FAVOURITES_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  useEffect(() => {
    let live = true;
    Promise.resolve().then(() => ids.length ? fetchStudioProducts({ ids }) : []).then((items) => { if (live) setProducts(items); }).catch(() => { if (live) setProducts([]); });
    return () => { live = false; };
  }, [ids]);
  return <section className="favourites-view" aria-labelledby="favourites-heading">
    <header><p className="journey-eyebrow">SAVED GIFTS</p><h1 id="favourites-heading">Your saved gifts</h1><p>Keep ideas here while you explore. Add the ones you want to price to your cart.</p></header>
    {products.length ? <ul>{products.map((product) => <li key={product.id}>
      <Link className="favourites-view__image" href={`/gifts/${product.slug}`}>{product.imageSrc ? <Image src={product.imageSrc} alt={product.imageAlt ?? ""} fill sizes="180px" style={{ objectFit: "contain" }} /> : null}</Link>
      <p>{product.categoryName}</p><h2><Link href={`/gifts/${product.slug}`}>{product.name}</Link></h2><p>{product.priceLabel}</p>
      <div><button type="button" onClick={() => { const current = readFavouriteIds(); if (current.includes(product.id)) setIds(toggleFavourite(product.id)); }}>Remove saved gift</button><Link href={`/gifts/${product.slug}`}>View gift</Link></div>
    </li>)}</ul> : <div className="favourites-view__empty"><p>No saved gifts yet. Save a star on anything you’d like to revisit.</p><Link className="journey-btn" href="/gifts">Explore the catalogue</Link></div>}
  </section>;
}
