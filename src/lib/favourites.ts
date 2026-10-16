const STORAGE_KEY = "monkcraft-favourites-v1";
export const FAVOURITES_EVENT = "monkcraft:favourites";

export function readFavouriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string"))].slice(0, 200) : [];
  } catch { return []; }
}

export function isFavourite(id: string, ids = readFavouriteIds()): boolean {
  return ids.includes(id);
}

export function toggleFavourite(id: string): string[] {
  const current = readFavouriteIds();
  const next = isFavourite(id, current) ? current.filter((item) => item !== id) : [...current, id].slice(-200);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(FAVOURITES_EVENT));
  }
  return next;
}
