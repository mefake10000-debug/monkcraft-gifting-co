"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState, type FormEvent } from "react";
import {
  getGiftCategoryById,
  type GiftCategory,
} from "@/data/giftCategories";
import { ConversionChannels } from "@/components/conversion/ConversionChannels";
import {
  getContactChannels,
  heroConsultCtaLabel,
} from "@/lib/contactConfig";
import {
  firstErrorMessage,
  validateEnquiryContact,
} from "@/lib/enquiryValidation";
import { patchBrief, readBrief } from "@/lib/brief";
import {
  packagingSummary,
  readBoxDraft,
} from "@/lib/box";
import { readShortlist } from "@/lib/shortlist";
import { buildWhatsAppPrefillMessage } from "@/lib/whatsapp";
import type { EnquiryProductLine } from "@/lib/enquiry/types";

type Status = "idle" | "ready";

function appendLinkedSelections(
  lines: string[],
  productSlug: string,
): EnquiryProductLine[] {
  const shortlist = readShortlist();
  const box = readBoxDraft();
  const products: EnquiryProductLine[] = [];

  if (shortlist.length > 0) {
    lines.push("", "Shortlisted products (this browser)");
    for (const item of shortlist) {
      lines.push(
        `- ${item.name} (id: ${item.id}) · qty ${item.quantity}` +
          (item.priceLabel ? ` · ${item.priceLabel}` : "") +
          (item.slug ? ` · /gifts/${item.slug}` : ""),
      );
      products.push({
        id: item.id,
        slug: item.slug,
        name: item.name,
        quantity: item.quantity,
        priceLabel: item.priceLabel,
      });
    }
  }

  const boxHasContent =
    box.products.length > 0 ||
    box.packaging != null ||
    Boolean(box.customization.companyName.trim());
  if (boxHasContent) {
    lines.push("", "Build a Box draft (this browser)");
    lines.push(`Packaging: ${packagingSummary(box.packaging)}`);
    lines.push(`Number of boxes: ${box.customization.numberOfBoxes}`);
    if (box.customization.companyName.trim()) {
      lines.push(`Company on box: ${box.customization.companyName.trim()}`);
    }
    if (box.customization.occasion.trim()) {
      lines.push(`Box occasion: ${box.customization.occasion.trim()}`);
    }
    for (const item of box.products) {
      lines.push(
        `- ${item.name} (id: ${item.id}) · ${item.quantityPerBox} per box` +
          (item.slug ? ` · /gifts/${item.slug}` : ""),
      );
      if (!products.some((p) => p.id === item.id)) {
        products.push({
          id: item.id,
          slug: item.slug,
          name: item.name,
          quantity: item.quantityPerBox,
          priceLabel: item.priceLabel,
        });
      }
    }
  }

  if (productSlug && !products.some((p) => p.slug === productSlug)) {
    products.unshift({
      name: productSlug,
      slug: productSlug,
      id: productSlug,
    });
  }

  if (shortlist.length > 0 || boxHasContent) {
    lines.push(
      "",
      "Full programme details also live in My Gifting Brief (/gifts/brief).",
    );
  }

  return products;
}

function buildEnquiry(input: {
  name: string;
  company: string;
  email: string;
  phone: string;
  quantity: string;
  occasion: string;
  budget: string;
  branding: string;
  delivery: string;
  message: string;
  giftCategoryId: string;
  productSlug: string;
  interest: string;
}) {
  const isCompanyStore = input.interest === "company-store";
  const lines = [
    isCompanyStore
      ? "Monkcraft Company Store enquiry"
      : "Monkcraft gifting enquiry",
    "------------------------",
    `Name: ${input.name}`,
    `Company: ${input.company}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone || "—"}`,
    `Interest: ${isCompanyStore ? "Company Store" : input.interest || "General gifting"}`,
    `Approx. quantity: ${input.quantity || "—"}`,
    `Gift idea category: ${input.giftCategoryId || "—"}`,
    `Product interest: ${input.productSlug || "—"}`,
    `Occasion / need: ${input.occasion || "—"}`,
    `Budget band: ${input.budget || "—"}`,
    `Branding / packaging: ${input.branding || "—"}`,
    `Delivery notes: ${input.delivery || "—"}`,
    "",
    "Message:",
    input.message || "—",
  ];

  const products = appendLinkedSelections(lines, input.productSlug);

  lines.push(
    "",
    "Note: This text is a prepared enquiry — not a submitted quotation. Online inbox delivery only succeeds when Monkcraft confirms server configuration.",
  );

  return { text: lines.join("\n"), products };
}

function readGiftId() {
  return new URLSearchParams(window.location.search).get("gift");
}

function readProductSlug() {
  return new URLSearchParams(window.location.search).get("product");
}

function readInterest() {
  return new URLSearchParams(window.location.search).get("interest");
}

function ConsultationForm({
  selectedCategory,
  productSlug,
  interest,
}: {
  selectedCategory?: GiftCategory;
  productSlug?: string | null;
  interest?: string | null;
}) {
  const isCompanyStore = interest === "company-store";
  const channels = getContactChannels();
  const [status, setStatus] = useState<Status>("idle");
  const [enquiryText, setEnquiryText] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [enquiryProducts, setEnquiryProducts] = useState<EnquiryProductLine[]>(
    [],
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState("");
  const [budget, setBudget] = useState("");
  const [branding, setBranding] = useState("");
  const [delivery, setDelivery] = useState("");
  const [occasion, setOccasion] = useState(
    selectedCategory?.title ??
      (isCompanyStore ? "Company Store programme" : ""),
  );
  const [message, setMessage] = useState(
    isCompanyStore
      ? "We are interested in a branded Company Store for our team. "
      : "",
  );

  useEffect(() => {
    // Prefill from local brief after mount (localStorage is client-only).
    startTransition(() => {
      const brief = readBrief();
      if (brief.contact.name) setName((v) => v || brief.contact.name);
      if (brief.contact.company) setCompany((v) => v || brief.contact.company);
      if (brief.contact.email) setEmail((v) => v || brief.contact.email);
      if (brief.contact.phone) setPhone((v) => v || brief.contact.phone);
      if (brief.occasion && !selectedCategory && !isCompanyStore) {
        setOccasion((v) => v || brief.occasion);
      }
      if (brief.recipientCount) setQuantity((v) => v || brief.recipientCount);
      if (brief.budgetPerRecipient) {
        setBudget((v) => v || brief.budgetPerRecipient);
      }
      if (brief.branding || brief.packagingPrefs) {
        setBranding(
          (v) =>
            v ||
            [brief.branding, brief.packagingPrefs].filter(Boolean).join(" · "),
        );
      }
      if (brief.deliveryDate || brief.deliveryLocation) {
        setDelivery(
          (v) =>
            v ||
            [brief.deliveryDate, brief.deliveryLocation]
              .filter(Boolean)
              .join(" · "),
        );
      }
      if (brief.notes && !isCompanyStore) {
        setMessage((v) => v || brief.notes);
      }
    });
  }, [selectedCategory, isCompanyStore]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const errors = validateEnquiryContact(
      { name, company, email, phone },
      { requireMessage: true, message },
    );
    setFieldErrors({
      name: errors.name ?? "",
      company: errors.company ?? "",
      email: errors.email ?? "",
      message: errors.message ?? "",
    });
    if (Object.keys(errors).length > 0) {
      setError(firstErrorMessage(errors));
      setStatus("idle");
      return;
    }

    // Persist contact onto brief for journey continuity.
    patchBrief({
      contact: {
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
      },
      occasion: occasion.trim() || undefined,
      recipientCount: quantity.trim() || undefined,
      budgetPerRecipient: budget.trim() || undefined,
      branding: branding.trim() || undefined,
      deliveryLocation: delivery.trim() || undefined,
      notes: message.trim() || undefined,
      fieldMode: "merge-nonempty",
    });

    const { text, products } = buildEnquiry({
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      quantity: quantity.trim(),
      occasion: occasion.trim(),
      budget: budget.trim(),
      branding: branding.trim(),
      delivery: delivery.trim(),
      message: message.trim(),
      giftCategoryId: selectedCategory?.id ?? "",
      productSlug: productSlug ?? "",
      interest: interest ?? "",
    });
    setEnquiryText(text);
    setEnquiryProducts(products);
    setWhatsappMessage(
      buildWhatsAppPrefillMessage({
        company: company.trim(),
        occasion: occasion.trim(),
        productLines:
          products.length > 0
            ? products.map((p) => ({
                name: p.name,
                id: p.id,
                quantity: p.quantity,
              }))
            : productSlug
              ? [{ name: productSlug, id: productSlug }]
              : undefined,
        quantity: quantity.trim(),
        budget: budget.trim(),
        branding: branding.trim(),
        notes: message.trim(),
      }),
    );
    setStatus("ready");
  }

  return (
    <section
      id="enquire"
      className="consultation"
      aria-labelledby="consultation-heading"
    >
      <div className="consultation__inner">
        <div className="consultation__story">
          <p className="consultation__eyebrow">Consultation</p>
          <h2 id="consultation-heading" className="consultation__heading">
            {isCompanyStore ? (
              <>
                Tell us about your Company Store.{" "}
                <span className="consultation__heading-accent">
                  We&apos;ll help you scope it.
                </span>
              </>
            ) : (
              <>
                Tell us what you&apos;re gifting.{" "}
                <span className="consultation__heading-accent">
                  We&apos;ll help you get there.
                </span>
              </>
            )}
          </h2>
          <p className="consultation__lede">
            {isCompanyStore
              ? "Share team size, branding goals, and merchandise scope. This form prepares an enquiry — it does not provision a live store."
              : "Share quantities, timeline, branding, and budget. Use the form, or open My Brief if you already have a shortlist or box."}
          </p>
          {selectedCategory || productSlug || isCompanyStore ? (
            <p className="consultation__selected" role="status">
              {isCompanyStore ? (
                <>
                  Interest: <strong>Company Store</strong>
                  {" · "}
                  <Link href="/company-stores/configure">
                    Open store configurator
                  </Link>
                  .{" "}
                </>
              ) : null}
              {selectedCategory ? (
                <>
                  Gift idea: <strong>{selectedCategory.title}</strong>.{" "}
                </>
              ) : null}
              {productSlug ? (
                <>
                  Product: <strong>{productSlug}</strong>.{" "}
                </>
              ) : null}
            </p>
          ) : null}
          <div className="consultation__story-actions">
            {!isCompanyStore ? (
              <Link className="journey-btn" href="/gifts/brief">
                Open My Brief
              </Link>
            ) : (
              <Link className="journey-btn" href="/company-stores/configure">
                Open store configurator
              </Link>
            )}
            {channels.hasBookingUrl && channels.bookingUrl ? (
              <a
                className="journey-btn journey-btn--ghost"
                href={channels.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {heroConsultCtaLabel(channels)}
              </a>
            ) : (
              <a className="journey-btn journey-btn--ghost" href="#enquiry-name">
                Prepare enquiry
              </a>
            )}
          </div>
          <p className="consultation__note">
            {channels.hasLiveChannel
              ? `After preparing, you can copy${
                  channels.hasEnquiryEmail ? ", email" : ""
                }${channels.hasBookingUrl ? ", book a call" : ""}${
                  channels.hasWhatsApp ? ", or use WhatsApp" : ""
                }. Online auto-submit is not connected yet.`
              : "Email, booking, and WhatsApp are not configured yet — prepare a ready-to-copy enquiry below."}
          </p>
        </div>

        <div className="consultation__panel">
          {status === "idle" ? (
            <form className="consultation__form" onSubmit={onSubmit} noValidate>
              {selectedCategory ? (
                <input
                  type="hidden"
                  name="giftCategory"
                  value={selectedCategory.id}
                />
              ) : null}
              <div className="consultation__field">
                <label htmlFor="enquiry-name">Name</label>
                <input
                  id="enquiry-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.name) || undefined}
                />
                {fieldErrors.name ? (
                  <span className="consultation__field-error">{fieldErrors.name}</span>
                ) : null}
              </div>
              <div className="consultation__field">
                <label htmlFor="enquiry-company">Company</label>
                <input
                  id="enquiry-company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  required
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.company) || undefined}
                />
                {fieldErrors.company ? (
                  <span className="consultation__field-error">
                    {fieldErrors.company}
                  </span>
                ) : null}
              </div>
              <div className="consultation__row">
                <div className="consultation__field">
                  <label htmlFor="enquiry-email">Work email</label>
                  <input
                    id="enquiry-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    aria-invalid={Boolean(fieldErrors.email) || undefined}
                  />
                  {fieldErrors.email ? (
                    <span className="consultation__field-error">
                      {fieldErrors.email}
                    </span>
                  ) : null}
                </div>
                <div className="consultation__field">
                  <label htmlFor="enquiry-phone">Phone</label>
                  <input
                    id="enquiry-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
              </div>
              <div className="consultation__row">
                <div className="consultation__field">
                  <label htmlFor="enquiry-quantity">Approx. quantity</label>
                  <select
                    id="enquiry-quantity"
                    name="quantity"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  >
                    <option value="">Select a range</option>
                    <option value="1–25">1–25</option>
                    <option value="26–100">26–100</option>
                    <option value="101–500">101–500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
                <div className="consultation__field">
                  <label htmlFor="enquiry-occasion">Occasion</label>
                  <input
                    id="enquiry-occasion"
                    name="occasion"
                    type="text"
                    value={occasion}
                    onChange={(event) => setOccasion(event.target.value)}
                    placeholder="e.g. Diwali, onboarding, client gifts"
                  />
                </div>
              </div>
              <div className="consultation__row">
                <div className="consultation__field">
                  <label htmlFor="enquiry-budget">Budget band</label>
                  <input
                    id="enquiry-budget"
                    name="budget"
                    type="text"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    placeholder="e.g. ₹800–1,200 per recipient"
                  />
                </div>
                <div className="consultation__field">
                  <label htmlFor="enquiry-branding">Branding / packaging</label>
                  <input
                    id="enquiry-branding"
                    name="branding"
                    type="text"
                    value={branding}
                    onChange={(event) => setBranding(event.target.value)}
                    placeholder="Logo print, custom sleeve…"
                  />
                </div>
              </div>
              <div className="consultation__field">
                <label htmlFor="enquiry-delivery">Delivery notes</label>
                <input
                  id="enquiry-delivery"
                  name="delivery"
                  type="text"
                  value={delivery}
                  onChange={(event) => setDelivery(event.target.value)}
                  placeholder="City / multi-address / desired timing"
                />
              </div>
              <div className="consultation__field">
                <label htmlFor="enquiry-message">How can we help?</label>
                <textarea
                  id="enquiry-message"
                  name="message"
                  rows={4}
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  aria-invalid={Boolean(fieldErrors.message) || undefined}
                  placeholder={
                    isCompanyStore
                      ? "Team size, cities, branding, catalogue scope, allowance ideas…"
                      : "Timeline, branding, cities, budget band…"
                  }
                />
                {fieldErrors.message ? (
                  <span className="consultation__field-error">
                    {fieldErrors.message}
                  </span>
                ) : null}
              </div>
              {error ? (
                <p className="consultation__error" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="consultation__submit" type="submit">
                Prepare my enquiry
              </button>
            </form>
          ) : (
            <div className="consultation__success" role="status">
              <h3 className="consultation__success-title">
                Your enquiry is ready to review
              </h3>
              <p className="consultation__success-text">
                This is a prepared summary — not an automatically submitted
                quotation. Review the text, then choose a next step.
              </p>
              <pre className="consultation__preview">{enquiryText}</pre>
              <ConversionChannels
                prepText={enquiryText}
                whatsappMessage={whatsappMessage}
                source={
                  isCompanyStore
                    ? "homepage-company-store"
                    : "homepage-consultation"
                }
                contact={{ name, company, email, phone }}
                programme={{
                  occasion,
                  recipientCount: quantity,
                  budgetPerRecipient: budget,
                  branding,
                  deliveryLocation: delivery,
                  notes: message,
                }}
                products={
                  enquiryProducts.length > 0 ? enquiryProducts : undefined
                }
                copyLabel="Copy enquiry"
                copiedLabel="Copied"
                secondaryActions={
                  <button
                    type="button"
                    className="journey-btn journey-btn--ghost"
                    onClick={() => {
                      setStatus("idle");
                      setEnquiryText("");
                      setEnquiryProducts([]);
                      setError("");
                    }}
                  >
                    Edit details
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Consultation() {
  const pathname = usePathname();
  const [giftId, setGiftId] = useState<string | null>(null);
  const [productSlug, setProductSlug] = useState<string | null>(null);
  const [interest, setInterest] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setGiftId(readGiftId());
      setProductSlug(readProductSlug());
      setInterest(readInterest());
    };
    sync();

    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;
      window.setTimeout(sync, 0);
    };
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
      document.removeEventListener("click", onClick);
    };
  }, [pathname]);

  const selectedCategory = getGiftCategoryById(giftId);

  return (
    <ConsultationForm
      key={`${selectedCategory?.id ?? "general"}-${productSlug ?? "none"}-${interest ?? "none"}`}
      selectedCategory={selectedCategory}
      productSlug={productSlug}
      interest={interest}
    />
  );
}
