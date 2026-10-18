import { createHmac, timingSafeEqual } from "node:crypto";

export type SupplierWhatsAppReply = {
  providerMessageId: string;
  senderPhone: string;
  contextMessageId: string | null;
  text: string;
  messageType: string;
};

export type SupplierAvailabilityTemplateInput = {
  phone: string;
  templateName: string;
  language: string;
  checkReference: string;
  requestReference: string;
  products: string;
  totalUnits: number;
  requestedDeliveryDate: string;
};

/** Build the approved, fixed-parameter supplier RFQ template; never free-form text. */
export function buildSupplierAvailabilityTemplate(input: SupplierAvailabilityTemplateInput) {
  const to = input.phone.replace(/[^0-9]/g, "");
  if (to.length < 8 || to.length > 15) throw new Error("invalid_supplier_phone");
  if (!/^[a-z0-9_]{3,512}$/.test(input.templateName)) throw new Error("invalid_template_name");
  if (!/^[a-z]{2,3}(?:[_-][a-zA-Z0-9]{2,8})?$/.test(input.language)) throw new Error("invalid_template_language");
  if (!input.checkReference || !input.requestReference || !input.products || !Number.isInteger(input.totalUnits) || input.totalUnits < 1) {
    throw new Error("invalid_supplier_check_template_data");
  }
  const parameters = [
    input.checkReference,
    input.requestReference,
    input.products.slice(0, 900),
    String(input.totalUnits),
    input.requestedDeliveryDate.slice(0, 100) || "Please confirm date",
  ].map((text) => ({ type: "text", text }));
  return {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.language },
      components: [{ type: "body", parameters }],
    },
  };
}

export function verifyWhatsAppSignature(rawBody: string, signature: string | null, appSecret: string): boolean {
  if (!signature?.startsWith("sha256=") || !appSecret) return false;
  const suppliedHex = signature.slice("sha256=".length);
  if (!/^[0-9a-f]{64}$/i.test(suppliedHex)) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  const supplied = Buffer.from(suppliedHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/** Extract inbound messages only. Message meaning and stock status stay human-reviewed. */
export function extractSupplierReplies(payload: unknown): SupplierWhatsAppReply[] {
  const root = object(payload);
  const entries = Array.isArray(root?.entry) ? root.entry : [];
  const replies: SupplierWhatsAppReply[] = [];
  for (const entryValue of entries) {
    const entry = object(entryValue);
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const changeValue of changes) {
      const change = object(changeValue);
      const value = object(change?.value);
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      for (const messageValue of messages) {
        const message = object(messageValue);
        const id = typeof message?.id === "string" ? message.id : "";
        const senderPhone = typeof message?.from === "string" ? message.from : "";
        if (!id || !senderPhone) continue;
        const messageType = typeof message?.type === "string" ? message.type : "unknown";
        const textObject = object(message?.text);
        const body = messageType === "text" && typeof textObject?.body === "string"
          ? textObject.body.trim().slice(0, 4000)
          : `[non-text reply: ${messageType}]`;
        const context = object(message?.context);
        replies.push({
          providerMessageId: id,
          senderPhone,
          contextMessageId: typeof context?.id === "string" ? context.id : null,
          text: body,
          messageType,
        });
      }
    }
  }
  return replies;
}
