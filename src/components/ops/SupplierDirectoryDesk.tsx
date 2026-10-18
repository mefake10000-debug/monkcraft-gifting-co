"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SupplierDirectoryRecord, SupplierProductMappingRecord } from "@/lib/automation/store";

type ProductOption = { id: string; sku: string; name: string; category: string };
type DirectoryResponse = { suppliers: SupplierDirectoryRecord[]; mappings: SupplierProductMappingRecord[] };
type SupplierForm = {
  id: string | null; supplierCode: string; displayName: string; category: string; contactName: string;
  phoneE164: string; email: string; whatsappOptIn: boolean; whatsappOptInEvidenceReference: string;
  active: boolean;
};
const EMPTY_SUPPLIER: SupplierForm = {
  id: null, supplierCode: "", displayName: "", category: "", contactName: "", phoneE164: "", email: "",
  whatsappOptIn: false, whatsappOptInEvidenceReference: "", active: true,
};

export function SupplierDirectoryDesk({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [directory, setDirectory] = useState<DirectoryResponse>({ suppliers: [], mappings: [] });
  const [supplier, setSupplier] = useState<SupplierForm>(EMPTY_SUPPLIER);
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [actor, setActor] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setError("");
    const response = await fetch("/api/ops/suppliers", { credentials: "same-origin", cache: "no-store" });
    if (response.status === 401) { router.push("/ops"); return; }
    const body = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(body?.suppliers) || !Array.isArray(body?.mappings)) {
      throw new Error(body?.error || "Supplier records are unavailable.");
    }
    setDirectory({ suppliers: body.suppliers, mappings: body.mappings });
  }

  useEffect(() => {
    let active = true;
    fetch("/api/ops/suppliers", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) throw new Error("Sign in to the operations desk to manage suppliers.");
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.suppliers) || !Array.isArray(body?.mappings)) throw new Error(body?.error || "Supplier records are unavailable.");
        return body as DirectoryResponse;
      })
      .then((body) => { if (active) setDirectory(body); })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Supplier records are unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products.slice(0, 80);
    return products.filter((product) => `${product.id} ${product.sku} ${product.name}`.toLowerCase().includes(term)).slice(0, 100);
  }, [products, search]);

  function editSupplier(record: SupplierDirectoryRecord) {
    setSupplier({
      id: record.id, supplierCode: record.supplier_code, displayName: record.display_name, category: record.category,
      contactName: record.contact_name || "", phoneE164: record.phone_e164 || "", email: record.email || "",
      whatsappOptIn: record.whatsapp_opt_in, whatsappOptInEvidenceReference: record.whatsapp_opt_in_evidence_reference || "",
      active: record.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function post(action: string, value: Record<string, unknown>, successMessage: string) {
    if (!actor.trim()) { setError("Enter your name first so the supplier audit trail identifies the staff member making this change."); return; }
    setBusy(action); setError(""); setNotice("");
    try {
      const response = await fetch("/api/ops/suppliers", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ action, [action === "save_supplier" ? "supplier" : "mapping"]: { ...value, actor: actor.trim() } }),
      });
      const body = await response.json().catch(() => null);
      if (response.status === 401) { router.push("/ops"); return; }
      if (!response.ok) throw new Error(body?.error || "The change could not be saved.");
      await load();
      setNotice(successMessage);
      if (action === "save_supplier") setSupplier(EMPTY_SUPPLIER);
      if (action === "save_mapping") { setProductId(""); setSupplierId(""); setVerifiedBy(""); setSearch(""); }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The change could not be saved.");
    } finally { setBusy(""); }
  }

  const activeSuppliers = directory.suppliers.filter((item) => item.active);
  const activeMappings = directory.mappings.filter((item) => item.active);
  return <main className="ops-shell">
    <header className="ops-header">
      <div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Supplier directory</h1><p className="ops-muted">Maintain supplier contacts, opt-in evidence, and verified mappings from catalogue product IDs to sourcing partners.</p></div>
      <nav className="ops-nav"><Link href="/ops">Supplier checks</Link><Link href="/ops/leads">Sales pipeline</Link><Link href="/ops/orders">Orders</Link><Link href="/ops/analytics">Analytics</Link><label className="ops-reviewer">Your name for the audit log<input value={actor} onChange={(event) => setActor(event.target.value)} maxLength={120} placeholder="Name" /></label><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav>
    </header>
    {error && <div className="ops-error ops-message" role="alert">{error}</div>}
    {notice && <div className="ops-success ops-message" role="status">{notice}</div>}
    <section className="ops-toolbar ops-finance-toolbar"><div><h2>{supplier.id ? "Edit supplier" : "Add supplier"}</h2><p className="ops-muted">WhatsApp sending is disabled unless the supplier opted in and the evidence is recorded.</p></div></section>
    <form className="ops-supplier-form" onSubmit={(event) => { event.preventDefault(); void post("save_supplier", supplier, supplier.id ? "Supplier record updated." : "Supplier added to the directory."); }}>
      <label>Supplier code<input required maxLength={40} value={supplier.supplierCode} onChange={(event) => setSupplier({ ...supplier, supplierCode: event.target.value })} placeholder="VENDOR-X" /></label>
      <label>Supplier name<input required maxLength={160} value={supplier.displayName} onChange={(event) => setSupplier({ ...supplier, displayName: event.target.value })} /></label>
      <label>Category<input required maxLength={120} value={supplier.category} onChange={(event) => setSupplier({ ...supplier, category: event.target.value })} placeholder="Drinkware" /></label>
      <label>Contact name<input maxLength={120} value={supplier.contactName} onChange={(event) => setSupplier({ ...supplier, contactName: event.target.value })} /></label>
      <label>WhatsApp phone (E.164)<input maxLength={20} value={supplier.phoneE164} onChange={(event) => setSupplier({ ...supplier, phoneE164: event.target.value })} placeholder="+919876543210" /></label>
      <label>Email<input type="email" maxLength={254} value={supplier.email} onChange={(event) => setSupplier({ ...supplier, email: event.target.value })} /></label>
      <label className="ops-supplier-checkbox"><input type="checkbox" checked={supplier.whatsappOptIn} onChange={(event) => setSupplier({ ...supplier, whatsappOptIn: event.target.checked })} /> Supplier opted in to WhatsApp availability checks</label>
      {supplier.whatsappOptIn && <label className="ops-supplier-wide">Opt-in evidence reference<input required minLength={3} maxLength={500} value={supplier.whatsappOptInEvidenceReference} onChange={(event) => setSupplier({ ...supplier, whatsappOptInEvidenceReference: event.target.value })} placeholder="Onboarding form or dated record reference" /></label>}
      {supplier.id && <label className="ops-supplier-checkbox"><input type="checkbox" checked={supplier.active} onChange={(event) => setSupplier({ ...supplier, active: event.target.checked })} /> Supplier is active for new sourcing requests</label>}
      <div className="ops-supplier-actions"><button type="button" className="ops-button ops-button-quiet" onClick={() => setSupplier(EMPTY_SUPPLIER)}>Clear</button><button className="ops-button" type="submit" disabled={busy === "save_supplier"}>{busy === "save_supplier" ? "Saving…" : supplier.id ? "Save supplier" : "Add supplier"}</button></div>
    </form>

    <section className="ops-toolbar ops-finance-toolbar"><div><h2>Product sourcing map</h2><p className="ops-muted">Use the stable product ID/SKU from the catalogue. One current supplier mapping is supported per product.</p></div></section>
    <form className="ops-supplier-form ops-mapping-form" onSubmit={(event) => { event.preventDefault(); void post("save_mapping", { productId, supplierId, category: products.find((item) => item.id === productId)?.category || "", verifiedBy }, "Product mapping saved and audited."); }}>
      <label className="ops-supplier-wide">Find catalogue product by name or ID<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product or SKU" /></label>
      <label>Catalogue product<select required value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Select product</option>{filteredProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>)}</select></label>
      <label>Active supplier<select required value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">Select supplier</option>{activeSuppliers.map((item) => <option key={item.id} value={item.id}>{item.display_name} · {item.category}</option>)}</select></label>
      <label>Verified by<input required maxLength={120} value={verifiedBy} onChange={(event) => setVerifiedBy(event.target.value)} placeholder="Name of person confirming source" /></label>
      <div className="ops-supplier-actions"><button className="ops-button" type="submit" disabled={busy === "save_mapping" || activeSuppliers.length === 0}>{busy === "save_mapping" ? "Saving…" : "Save product mapping"}</button></div>
    </form>

    <section className="ops-toolbar ops-finance-toolbar"><div><h2>Current suppliers and mappings</h2><p className="ops-muted">{directory.suppliers.length} suppliers · {activeMappings.length} active product mappings</p></div></section>
    {loading ? <div className="ops-empty"><p>Loading supplier records…</p></div> : <>
      <section className="ops-check-list" aria-label="Supplier records">{directory.suppliers.map((record) => <article className="ops-supplier-card" key={record.id}>
        <div className="ops-finance-record-head"><div><p className="ops-eyebrow">{record.supplier_code} · {record.category}</p><h3>{record.display_name}</h3><p className="ops-muted">{[record.contact_name, record.phone_e164, record.email].filter(Boolean).join(" · ") || "No contact details"}</p><p className="ops-muted">WhatsApp: {record.whatsapp_opt_in ? `opted in · ${record.whatsapp_opt_in_evidence_reference}` : "not opted in"} · Notion: {record.notion_sync_status}{record.notion_last_error ? ` · ${record.notion_last_error}` : ""}</p></div><span className={`ops-status ops-status-${record.active ? "active" : "revoked"}`}>{record.active ? "Active" : "Paused"}</span></div>
        <button className="ops-button ops-button-quiet" type="button" onClick={() => editSupplier(record)}>Edit supplier</button>
      </article>)}</section>
      <section className="ops-mapping-list" aria-label="Catalogue product supplier mappings">{directory.mappings.map((mapping) => <article className="ops-mapping-row" key={mapping.product_id}>
        <div><strong>{products.find((product) => product.id === mapping.product_id)?.name || "Catalogue product"}</strong><span>{mapping.product_id}</span></div><div><strong>{mapping.supplier_name}</strong><span>{mapping.category || "Category not set"} · verified by {mapping.verified_by || "unknown"} · {mapping.active ? "Active" : "Inactive"}</span></div>
        {mapping.active && <button type="button" className="ops-button ops-button-quiet" disabled={busy === "deactivate_mapping"} onClick={() => { if (window.confirm(`Deactivate the supplier mapping for ${mapping.product_id}?`)) void post("deactivate_mapping", { productId: mapping.product_id }, "Product mapping deactivated."); }}>{busy === "deactivate_mapping" ? "Saving…" : "Deactivate"}</button>}
      </article>)}</section>
      {directory.mappings.length === 0 && <div className="ops-empty"><p>No product mappings yet. Add verified catalogue ID-to-supplier pairs to route availability checks.</p></div>}
    </>}
  </main>;
}
