const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUPPLIER_CODE = /^[A-Z0-9][A-Z0-9_-]{1,39}$/;
const E164 = /^\+[1-9]\d{6,14}$/;

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export type SupplierDirectoryInput = {
  id: string | null;
  supplierCode: string;
  displayName: string;
  category: string;
  contactName: string;
  phoneE164: string;
  email: string;
  whatsappOptIn: boolean;
  whatsappOptInEvidenceReference: string;
  active: boolean;
  actor: string;
};

export type SupplierProductMappingInput = {
  productId: string;
  supplierId: string;
  category: string;
  verifiedBy: string;
  actor: string;
};

export function validateMappingRetirementInput(value: unknown): { ok: true; productId: string; actor: string } | { ok: false; error: string } {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const productId = clean(input.productId, 80);
  const actor = clean(input.actor, 120);
  return productId && actor ? { ok: true, productId, actor } : { ok: false, error: "Product ID and staff name are required to deactivate a mapping." };
}

export function validateSupplierDirectoryInput(value: unknown):
  | { ok: true; value: SupplierDirectoryInput }
  | { ok: false; error: string } {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = clean(input.id, 36) || null;
  const supplierCode = clean(input.supplierCode, 40).toUpperCase();
  const displayName = clean(input.displayName, 160);
  const category = clean(input.category, 120);
  const contactName = clean(input.contactName, 120);
  const phoneE164 = clean(input.phoneE164, 20);
  const email = clean(input.email, 254).toLowerCase();
  const whatsappOptIn = input.whatsappOptIn === true;
  const whatsappOptInEvidenceReference = clean(input.whatsappOptInEvidenceReference, 500);
  const active = input.active !== false;
  const actor = clean(input.actor, 120);
  if (id && !UUID.test(id)) return { ok: false, error: "Select a valid supplier record." };
  if (!SUPPLIER_CODE.test(supplierCode)) return { ok: false, error: "Supplier code must use 2–40 letters, numbers, hyphens, or underscores." };
  if (!displayName || !category || !actor) return { ok: false, error: "Supplier name, category, and staff name are required." };
  if (phoneE164 && !E164.test(phoneE164)) return { ok: false, error: "Supplier WhatsApp phone must use international E.164 format, such as +919876543210." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Supplier email address is invalid." };
  if (whatsappOptIn && (!phoneE164 || whatsappOptInEvidenceReference.length < 3)) {
    return { ok: false, error: "A WhatsApp number and opt-in evidence reference are required before enabling supplier messages." };
  }
  return { ok: true, value: { id, supplierCode, displayName, category, contactName, phoneE164, email, whatsappOptIn, whatsappOptInEvidenceReference, active, actor } };
}

export function validateSupplierProductMappingInput(value: unknown):
  | { ok: true; value: SupplierProductMappingInput }
  | { ok: false; error: string } {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const productId = clean(input.productId, 80);
  const supplierId = clean(input.supplierId, 36);
  const category = clean(input.category, 120);
  const verifiedBy = clean(input.verifiedBy, 120);
  const actor = clean(input.actor, 120);
  if (!productId || !UUID.test(supplierId) || !verifiedBy || !actor) {
    return { ok: false, error: "Choose a catalogue product and supplier, then enter the verifier and staff name." };
  }
  return { ok: true, value: { productId, supplierId, category, verifiedBy, actor } };
}
