"use client";

import { useEffect, useState } from "react";
import { FAVOURITES_EVENT, isFavourite, readFavouriteIds, toggleFavourite } from "@/lib/favourites";

export function FavouriteButton({ id, name }: { id: string; name: string }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    const sync = () => setActive(isFavourite(id, readFavouriteIds()));
    sync();
    window.addEventListener(FAVOURITES_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(FAVOURITES_EVENT, sync); window.removeEventListener("storage", sync); };
  }, [id]);
  return <button type="button" className={`favourite-button${active ? " favourite-button--active" : ""}`} aria-label={active ? `Remove ${name} from saved gifts` : `Save ${name}`} aria-pressed={active} onClick={() => setActive(isFavourite(id, toggleFavourite(id)))}>{active ? "★" : "☆"}</button>;
}
