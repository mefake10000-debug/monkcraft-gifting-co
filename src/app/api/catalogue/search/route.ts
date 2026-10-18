import { NextRequest, NextResponse } from "next/server";
import {
  getAllProducts,
  getProductById,
  getProductBySlug,
} from "@/data/catalogue/products";
import { emptyCatalogueQuery } from "@/data/catalogue/queryParams";
import { filterProducts, sortProducts } from "@/data/catalogue/query";
import { toStudioProductSummary } from "@/lib/studio/productSummary";

/**
 * Lightweight catalogue lookup for Studio / Company Store pickers.
 * Returns genuine export-backed products only — never invents inventory.
 * Supports q, category, occasion, budgetMin/Max, page, limit, ids, slug.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const slug = (sp.get("slug") || "").trim();
  const idsParam = (sp.get("ids") || "").trim();
  const limitRaw = Number(sp.get("limit") || "24");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(48, Math.max(1, Math.floor(limitRaw)))
    : 24;
  const pageRaw = Number(sp.get("page") || "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  if (slug) {
    const product = getProductBySlug(slug);
    return NextResponse.json({
      products: product ? [toStudioProductSummary(product)] : [],
      total: product ? 1 : 0,
      page: 1,
      pageSize: 1,
    });
  }

  if (idsParam) {
    const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);
    const products = ids
      .map((id) => getProductById(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map(toStudioProductSummary);
    return NextResponse.json({
      products,
      total: products.length,
      page: 1,
      pageSize: products.length,
    });
  }

  const parsePositive = (raw: string | null): number | null => {
    if (!raw) return null;
    const n = Number(raw.replace(/[₹,\s]/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  };

  const query = {
    ...emptyCatalogueQuery(),
    q: (sp.get("q") || "").trim(),
    categories: (sp.get("category") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    occasions: (sp.get("occasion") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    colours: (sp.get("colour") || sp.get("color") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    materials: (sp.get("material") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    budgetMinInr: parsePositive(sp.get("budgetMin")),
    budgetMaxInr: parsePositive(sp.get("budgetMax") || sp.get("budget")),
    page: 1,
  };

  const filtered = filterProducts(getAllProducts(), query);
  const sorted = sortProducts(filtered, "featured", query);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const products = sorted
    .slice(start, start + limit)
    .map(toStudioProductSummary);

  return NextResponse.json({
    products,
    total,
    page: safePage,
    pageSize: limit,
    totalPages,
  });
}
