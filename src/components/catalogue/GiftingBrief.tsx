"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { BriefContact, GiftingBriefDraft } from "@/data/catalogue/types";
import { ConversionChannels } from "@/components/conversion/ConversionChannels";
import {
  buildBriefWhatsAppMessage,
  saveBriefProgramme,
  writeBrief,
} from "@/lib/brief";
import {
  decodeSharedBrief,
  SHARED_BRIEF_PARAM,
} from "@/lib/briefShare";
import {
  buildWorkspaceQuotationText,
  readBriefWorkspace,
  refreshBriefLinksFromLiveDrafts,
  type BriefWorkspaceSnapshot,
} from "@/lib/briefWorkspace";
import {
  firstErrorMessage,
  validateEnquiryContact,
} from "@/lib/enquiryValidation";
import {
  standardProductQuantityFloor,
  shortlistTotalUnits,
  writeShortlist,
} from "@/lib/shortlist";

type Step = "edit" | "prepared";

function emptyContact(): BriefContact {
  return { name: "", company: "", email: "", phone: "" };
}

export function GiftingBrief() {
  const [snapshot, setSnapshot] = useState<BriefWorkspaceSnapshot | null>(null);
  const [contact, setContact] = useState<BriefContact>(emptyContact());
  const [step, setStep] = useState<Step>("edit");
  const [prepText, setPrepText] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [sharedPayload, setSharedPayload] = useState<ReturnType<
    typeof decodeSharedBrief
  >>(null);

  // Detect an inbound shared brief (?brief=…) without clobbering this draft.
  useEffect(() => {
    const detect = () => {
      const token = new URLSearchParams(window.location.search).get(
        SHARED_BRIEF_PARAM,
      );
      if (!token) return;
      const decoded = decodeSharedBrief(token);
      if (decoded) setSharedPayload(decoded);
    };
    detect();
  }, []);

  useEffect(() => {
    const sync = () => {
      try {
        const next = readBriefWorkspace();
        setSnapshot(next);
        setContact((current) => {
          // Prefer saved brief contact when local form contact is still empty
          const saved = next.brief.contact;
          if (
            !current.name &&
            !current.company &&
            !current.email &&
            !current.phone
          ) {
            return { ...saved };
          }
          return current;
        });
      } catch {
        setError("Could not load your gifting brief draft. Try refreshing.");
      }
    };
    sync();
    const events = [
      "monkcraft:shortlist",
      "monkcraft:brief",
      "monkcraft:box",
      "monkcraft:studio-branding",
      "monkcraft:studio-catalogue",
      "monkcraft:company-store-draft",
      "storage",
    ] as const;
    for (const event of events) {
      window.addEventListener(event, sync);
    }
    return () => {
      for (const event of events) {
        window.removeEventListener(event, sync);
      }
    };
  }, []);

  const brief = snapshot?.brief ?? null;
  const products = useMemo(
    () => snapshot?.products ?? [],
    [snapshot?.products],
  );
  const units = useMemo(() => shortlistTotalUnits(products), [products]);

  function persistProgramme(
    next: GiftingBriefDraft,
    productIds = products.map((item) => item.id),
  ) {
    saveBriefProgramme({
      occasion: next.occasion,
      audience: next.audience,
      recipientCount: next.recipientCount,
      budgetPerRecipient: next.budgetPerRecipient,
      branding: next.branding,
      packagingPrefs: next.packagingPrefs,
      deliveryDate: next.deliveryDate,
      dispatchType: next.dispatchType,
      deliveryLocation: next.deliveryLocation,
      notes: next.notes,
      contact: next.contact,
      productIds,
      sources: next.sources,
    });
  }

  function updateField<K extends keyof GiftingBriefDraft>(
    key: K,
    value: GiftingBriefDraft[K],
  ) {
    setSnapshot((current) => {
      if (!current) return current;
      const nextBrief = { ...current.brief, [key]: value };
      persistProgramme(nextBrief);
      return { ...current, brief: nextBrief };
    });
  }

  function updateContactField<K extends keyof BriefContact>(
    key: K,
    value: BriefContact[K],
  ) {
    const next = { ...contact, [key]: value };
    setContact(next);
    if (!brief) return;
    const nextBrief = { ...brief, contact: next };
    persistProgramme(nextBrief);
    setSnapshot((snap) => (snap ? { ...snap, brief: nextBrief } : snap));
  }

  async function onPrepare(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!snapshot || !brief) return;

    const contactErrors = validateEnquiryContact(contact);
    if (Object.keys(contactErrors).length > 0) {
      setError(firstErrorMessage(contactErrors));
      return;
    }

    setRefreshing(true);
    try {
      await refreshBriefLinksFromLiveDrafts();
      const fresh = readBriefWorkspace();
      const required = fresh.missing.filter((item) => item.severity === "required");
      if (required.length > 0) {
        setError(required.map((item) => item.label).join(". ") + ".");
        setSnapshot(fresh);
        return;
      }

      // Persist contact onto brief for recovery (prepare-time only)
      saveBriefProgramme({
        ...fresh.brief,
        contact: {
          name: contact.name.trim(),
          company: contact.company.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
        },
        productIds: fresh.products.map((item) => item.id),
      });

      const withContact = readBriefWorkspace();
      const text = buildWorkspaceQuotationText(withContact, contact);
      setSnapshot(withContact);
      setPrepText(text);
      setStep("prepared");
    } catch {
      setError(
        "Could not prepare the quotation brief. Check your connection and try again, or copy details from your shortlist.",
      );
    } finally {
      setRefreshing(false);
    }
  }

  function stripSharedParam() {
    const url = new URL(window.location.href);
    url.searchParams.delete(SHARED_BRIEF_PARAM);
    window.history.replaceState({}, "", url.toString());
  }

  function importSharedBrief() {
    if (!sharedPayload) return;
    const { brief: incoming, products: incomingProducts } = sharedPayload;
    writeBrief({
      occasion: incoming.occasion,
      audience: incoming.audience,
      recipientCount: incoming.recipientCount,
      budgetPerRecipient: incoming.budgetPerRecipient,
      branding: incoming.branding,
      packagingPrefs: incoming.packagingPrefs,
      deliveryDate: incoming.deliveryDate,
      dispatchType: incoming.dispatchType,
      deliveryLocation: incoming.deliveryLocation,
      notes: incoming.notes,
      contact: incoming.contact,
      productIds: incomingProducts.map((item) => item.id),
      fieldMode: "replace",
      overwriteEmpty: true,
    });
    if (incomingProducts.length > 0) {
      writeShortlist(incomingProducts);
    }
    setContact({ ...incoming.contact });
    setSharedPayload(null);
    stripSharedParam();
  }

  function dismissSharedBrief() {
    setSharedPayload(null);
    stripSharedParam();
  }

  if (!snapshot || !brief) {
    return (
      <div
        className="journey-panel"
        aria-busy={!error}
        role={error ? "alert" : undefined}
      >
        <p>{error || "Loading your gifting brief…"}</p>
        {error ? (
          <p>
            <Link className="journey-btn journey-btn--ghost" href="/gifts">
              Browse catalogue
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  if (step === "prepared") {
    const waMessage = buildBriefWhatsAppMessage(
      snapshot.brief,
      snapshot.products,
      contact,
    );
    return (
      <div className="journey-panel">
        <p className="journey-eyebrow">Bulk quote</p>
        <h1>Review your quote request</h1>
        <p>
          Check the quantities and delivery notes, then choose an available way to contact Monkcraft. No payment or order confirmation happens here.
        </p>
        <pre className="journey-preview">{prepText}</pre>
        {error ? (
          <p className="journey-error" role="alert">
            {error}
          </p>
        ) : null}
        <ConversionChannels
          prepText={prepText}
          whatsappMessage={waMessage}
          source="gifts-brief"
          contact={contact}
          programme={{
            occasion: snapshot.brief.occasion,
            audience: snapshot.brief.audience,
            recipientCount: snapshot.brief.recipientCount,
            budgetPerRecipient: snapshot.brief.budgetPerRecipient,
            branding: snapshot.brief.branding,
            packagingPrefs: snapshot.brief.packagingPrefs,
            deliveryDate: snapshot.brief.deliveryDate,
            dispatchType: snapshot.brief.dispatchType,
            deliveryLocation: snapshot.brief.deliveryLocation,
            notes: snapshot.brief.notes,
          }}
          products={snapshot.products.map((item) => ({
            id: item.id,
            slug: item.slug,
            name: item.name,
            quantity: item.quantity,
            priceLabel: item.priceLabel,
            categoryName: item.categoryName,
          }))}
          copyLabel="Copy complete quote"
          copiedLabel="Copied"
          secondaryActions={
            <>
              <button
                type="button"
                className="journey-btn journey-btn--ghost"
                onClick={() => {
                  setStep("edit");
                  setError("");
                }}
              >
                Edit brief
              </button>
            </>
          }
        />
      </div>
    );
  }

  const required = snapshot.missing.filter((m) => m.severity === "required");
  const hasLinkedSetup = snapshot.hasBoxContent || snapshot.hasBrandingContent || snapshot.hasCatalogueContent || snapshot.hasCompanyStoreContent;
  const isEmpty =
    products.length === 0 &&
    !snapshot.hasBoxContent &&
    !snapshot.hasBrandingContent &&
    !snapshot.hasCatalogueContent &&
    !snapshot.hasCompanyStoreContent &&
    !brief.occasion.trim();

  return (
    <div className="journey-panel">
      <header className="journey-panel__head">
        <div>
          <p className="journey-eyebrow">Bulk quote</p>
          <h1>Request a quote</h1>
          <p>Review your products and quantities. Add only the order details you already know, then send one request. No box is required.</p>
        </div>
        <div className="journey-actions">
          <Link className="journey-btn journey-btn--ghost" href="/gifts">
            Add products
          </Link>
          <Link className="journey-btn journey-btn--ghost" href="/gifts/box">
            {snapshot.hasBoxContent ? "Edit box" : "Build a Box"}
          </Link>
        </div>
      </header>

      {sharedPayload ? (
        <div className="journey-callout brief-share-banner" role="status">
          <p>
            A shared gifting brief is available
            {sharedPayload.products.length > 0
              ? ` with ${sharedPayload.products.length} product${
                  sharedPayload.products.length === 1 ? "" : "s"
                }`
              : ""}
            . Import it over this browser&apos;s draft, or dismiss to keep what
            you have.
          </p>
          <div className="journey-actions">
            <button
              type="button"
              className="journey-btn"
              onClick={importSharedBrief}
            >
              Import shared brief
            </button>
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={dismissSharedBrief}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {isEmpty ? (
        <div className="journey-callout" role="status">
          <p>
            Start with gifts or a box, then add your event details here. Your
            draft saves automatically in this browser.
          </p>
          <div className="journey-actions">
            <Link href="/gifts">Browse catalogue</Link>
            <Link href="/gifts/box">Build a Box</Link>
            {snapshot.studioRouteAvailable ? (
              <Link href="/studio">Open Studio</Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {required.length > 0 && !isEmpty ? (
        <div className="brief-missing" role="status">
          <p className="brief-missing__title">One thing to finish</p>
          <ul>
            {required.map((item) => (
              <li key={item.id} data-severity="required">
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section id="brief-products" className="brief-section" aria-labelledby="brief-products-heading">
        <div className="brief-section__head">
          <h2 id="brief-products-heading">Products & quantities</h2>
          <p>
            {products.length
              ? `${products.length} product${products.length === 1 ? "" : "s"} · ${units} total units`
              : "None yet — add from the catalogue"}
          </p>
        </div>
        {products.length === 0 ? (
          <div className="journey-callout">
            <Link href="/gifts">Add products from the catalogue</Link>
            {" · "}
            <Link href="/gifts/shortlist">Open cart</Link>
          </div>
        ) : (
          <ul className="shortlist-list">
            {products.map((item) => (
              <li key={item.id} className="shortlist-row">
                <div className="shortlist-row__media">
                  {item.imageSrc ? (
                    <Image
                      src={item.imageSrc}
                      alt=""
                      width={96}
                      height={96}
                      className="shortlist-row__image"
                    />
                  ) : (
                    <div className="shortlist-row__placeholder">No image</div>
                  )}
                </div>
                <div className="shortlist-row__body">
                  <p className="shortlist-row__meta">{item.categoryName}</p>
                  <h3>
                    <Link href={`/gifts/${item.slug}`}>{item.name}</Link>
                  </h3>
                  <p className="shortlist-row__price">
                    {item.priceLabel || "Price to confirm"}
                  </p>
                  <p className="shortlist-row__moq">{item.quantity} pcs · minimum {standardProductQuantityFloor(item.minQuantity)} pcs</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {products.length > 0 ? <Link className="brief-edit-quote-link" href="/gifts/shortlist">Edit cart products or quantities</Link> : null}

      {hasLinkedSetup ? <section id="brief-linked" className="brief-section" aria-labelledby="brief-linked-heading">
        <div className="brief-section__head">
          <h2 id="brief-linked-heading">Linked configurations</h2>
          <p>Live drafts from other Monkcraft tools — included when you prepare a quote.</p>
        </div>
        <ul className="brief-links">
          <li className="brief-link-card">
            <div>
              <h3>Build a Box</h3>
              {snapshot.hasBoxContent ? (
                <p>
                  {snapshot.box.products.length} product
                  {snapshot.box.products.length === 1 ? "" : "s"}
                  {" · "}
                  {snapshot.box.customization.numberOfBoxes} box
                  {snapshot.box.customization.numberOfBoxes === 1 ? "" : "es"}
                </p>
              ) : (
                <p>No box draft yet.</p>
              )}
            </div>
            <Link className="brief-link-card__cta" href="/gifts/box">
              {snapshot.hasBoxContent ? "Review box" : "Start Build a Box"}
            </Link>
          </li>

          <li className="brief-link-card">
            <div>
              <h3>Studio branding</h3>
              {snapshot.hasBrandingContent ? (
                <p>
                  {snapshot.branding.logo
                    ? `Mockup with ${snapshot.branding.logo.fileName}`
                    : "Mockup draft · logo not attached"}
                </p>
              ) : (
                <p>
                  {snapshot.studioRouteAvailable
                    ? "No branding mockup yet."
                    : "Studio branding UI not available in this build."}
                </p>
              )}
            </div>
            {snapshot.studioRouteAvailable ? (
              <Link className="brief-link-card__cta" href="/studio">
                {snapshot.hasBrandingContent ? "Open Studio" : "Customize in Studio"}
              </Link>
            ) : (
              <span className="brief-link-card__muted">Coming soon</span>
            )}
          </li>

          <li className="brief-link-card">
            <div>
              <h3>White-label catalogue</h3>
              {snapshot.hasCatalogueContent ? (
                <p>
                  {snapshot.catalogue.title || "Untitled draft"}
                  {" · "}
                  {snapshot.catalogue.productIds.length} product
                  {snapshot.catalogue.productIds.length === 1 ? "" : "s"}
                </p>
              ) : (
                <p>No reseller catalogue draft yet.</p>
              )}
            </div>
            {snapshot.studioRouteAvailable ? (
              <Link className="brief-link-card__cta" href="/studio?mode=catalogue">
                Open Studio catalogue
              </Link>
            ) : (
              <span className="brief-link-card__muted">Coming soon</span>
            )}
          </li>

          <li className="brief-link-card">
            <div>
              <h3>Company Store proposal</h3>
              {snapshot.hasCompanyStoreContent ? (
                <p>
                  {snapshot.companyStore.identity.storeName ||
                    snapshot.companyStore.identity.companyName ||
                    "Untitled store"}
                  {" · "}
                  {snapshot.companyStore.productIds.length} product
                  {snapshot.companyStore.productIds.length === 1 ? "" : "s"}
                </p>
              ) : (
                <p>
                  {snapshot.companyStoreRouteAvailable
                    ? "No store proposal draft yet."
                    : "Company Stores UI not available in this build."}
                </p>
              )}
            </div>
            {snapshot.companyStoreRouteAvailable ? (
              <Link className="brief-link-card__cta" href={snapshot.hasCompanyStoreContent ? "/company-stores/configure" : "/company-stores"}>
                {snapshot.hasCompanyStoreContent
                  ? "Review store draft"
                  : "Explore Company Stores"}
              </Link>
            ) : (
              <span className="brief-link-card__muted">Coming soon</span>
            )}
          </li>
        </ul>
      </section> : null}

      <form className="brief-form" onSubmit={onPrepare} noValidate>
        <section id="brief-programme" className="brief-section" aria-labelledby="brief-programme-heading">
          <div className="brief-section__head">
            <h2 id="brief-programme-heading">Order details</h2>
            <p>
              The items below are optional. Add what you already know; Monkcraft can confirm the rest with you.
            </p>
          </div>
          <details className="brief-optional-details">
            <summary>Add occasion, budget or delivery details</summary>
          <div className="brief-form__grid">
            <label>
              Dispatch plan
              <select
                name="dispatchType"
                value={brief.dispatchType}
                onChange={(event) => updateField("dispatchType", event.target.value as GiftingBriefDraft["dispatchType"])}
              >
                <option value="unsure">To be confirmed</option>
                <option value="single-city">One delivery point in one city</option>
                <option value="multi-point">Multiple delivery points</option>
                <option value="international">International dispatch</option>
              </select>
            </label>
            <label>
              Occasion
              <input
                name="occasion"
                value={brief.occasion}
                onChange={(event) => updateField("occasion", event.target.value)}
                placeholder="Optional — e.g. employee onboarding or Diwali"
              />
            </label>
            <label>
              Audience / recipient group
              <input
                name="audience"
                value={brief.audience}
                onChange={(event) => updateField("audience", event.target.value)}
                placeholder="e.g. New joiners, VIP clients, event attendees"
              />
            </label>
            <label>
              Total recipients / quantity
              <input
                name="recipientCount"
                value={brief.recipientCount}
                onChange={(event) =>
                  updateField("recipientCount", event.target.value)
                }
                placeholder="e.g. 250 people"
              />
            </label>
            <label>
              Target budget per recipient / box
              <input
                name="budgetPerRecipient"
                value={brief.budgetPerRecipient}
                onChange={(event) =>
                  updateField("budgetPerRecipient", event.target.value)
                }
                placeholder="e.g. ₹800–1,200"
              />
            </label>
            <label>
              Custom branding
              <input
                name="branding"
                value={brief.branding}
                onChange={(event) => updateField("branding", event.target.value)}
                placeholder="e.g. Embroidery logo, DTF print, gift note"
              />
            </label>
            <label>
              Packaging preferences
              <input
                name="packagingPrefs"
                value={brief.packagingPrefs}
                onChange={(event) =>
                  updateField("packagingPrefs", event.target.value)
                }
                placeholder="e.g. Kraft box, premium sleeve, eco wrap"
              />
            </label>
            <label>
              Desired delivery date
              <input
                name="deliveryDate"
                value={brief.deliveryDate}
                onChange={(event) =>
                  updateField("deliveryDate", event.target.value)
                }
                placeholder="e.g. Before 10 Nov — request only, not confirmed"
              />
            </label>
            <label>
              City / region or multi-address notes
              <input
                name="deliveryLocation"
                value={brief.deliveryLocation}
                onChange={(event) =>
                  updateField("deliveryLocation", event.target.value)
                }
                placeholder="e.g. Bengaluru HQ + 3 city offices"
              />
            </label>
          </div>
          <label>
            Additional notes
            <textarea
              name="notes"
              rows={3}
              value={brief.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Anything else the team should know"
            />
          </label>
          </details>
        </section>

        <fieldset id="brief-contact" className="brief-form__contact">
          <legend>Your contact details</legend>
          <div className="brief-form__grid">
            <label>
              Name
              <input
                value={contact.name}
                onChange={(event) =>
                  updateContactField("name", event.target.value)
                }
                autoComplete="name"
              />
            </label>
            <label>
              Company
              <input
                value={contact.company}
                onChange={(event) =>
                  updateContactField("company", event.target.value)
                }
                autoComplete="organization"
              />
            </label>
            <label>
              Email <span className="field-optional">(optional if you add a phone)</span>
              <input
                type="email"
                value={contact.email}
                onChange={(event) =>
                  updateContactField("email", event.target.value)
                }
                autoComplete="email"
              />
            </label>
            <label>
              Phone <span className="field-optional">(optional if you add an email)</span>
              <input
                type="tel"
                value={contact.phone}
                onChange={(event) =>
                  updateContactField("phone", event.target.value)
                }
                autoComplete="tel"
              />
            </label>
          </div>
        </fieldset>

        {error ? (
          <p className="journey-error" role="alert">
            {error}
          </p>
        ) : null}

        <div id="brief-actions" className="journey-actions journey-actions--footer">
            <button type="submit" className="journey-btn" disabled={refreshing}>
            {refreshing ? "Preparing…" : "Review quote request"}
          </button>
          <Link className="journey-btn journey-btn--ghost" href="/gifts/shortlist">
            Edit cart
          </Link>
        </div>
      </form>
    </div>
  );
}
