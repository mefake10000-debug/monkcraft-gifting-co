import { connection } from "next/server";
import { Suspense } from "react";
import { SupplierDirectoryDesk } from "@/components/ops/SupplierDirectoryDesk";
import { getAllProducts } from "@/data/catalogue/products";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default function SupplierDirectoryPage() {
  return <Suspense fallback={<main className="ops-shell"><p className="ops-muted">Loading supplier directory…</p></main>}><SupplierDirectoryContent /></Suspense>;
}

async function SupplierDirectoryContent() {
  await connection();
  await requireOperationsSession();
  const products = getAllProducts().map((product) => ({ id: product.id, sku: product.sku, name: product.name, category: product.categoryName }));
  return <SupplierDirectoryDesk products={products} />;
}
