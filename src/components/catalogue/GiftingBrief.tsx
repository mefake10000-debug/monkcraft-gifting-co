"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { BriefContact, GiftingBriefDraft } from "@/data/catalogue/types";
import { ConversionChannels } from "@/components/conversion/ConversionChannels";
import {
  buildBriefWhatsAppMessage,
  clearBrief,
  saveBriefProgramme,
} from "@/lib/brief";
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
  removeFromShortlist,
  setShortlistQuantity,
  shortlistTotalUnits,
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
        <p className="journey-eyebrow">Quotation preparation</p>
        <h1>Your brief is ready to review</h1>
        <p>
          This is a prepared enquiry summary — not a submitted quotation. Review
          the text, then choose how to continue. Your draft stays saved in this
          browser.
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
          copyLabel="Copy quotation brief"
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
              <Link className="journey-btn journey-btn--ghost" href="/gifts">
                Keep browsing
              </Link>
              <Link className="journey-btn journey-btn--ghost" href="/#enquire">
                Talk to Monkcraft
              </Link>
            </>
          }
        />
      </div>
    );
  }

  const recommended = snapshot.missing.filter((m) => m.severity === "recommended");
  const required = snapshot.missing.filter((m) => m.severity === "required");
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
          <p className="journey-eyebrow">My Gifting Brief</p>
          <h1>One place for your quotation</h1>
          <p>
            Review shortlisted products, linked box and Studio details, then fill
            programme needs. Everything autosaves in this browser — not synced
            across devices.
          </p>
        </div>
        <div className="journey-actions">
          <Link className="journey-btn journey-btn--ghost" href="/gifts">
            Browse gifts
          </Link>
          <Link className="journey-btn journey-btn--ghost" href="/gifts/box">
            {snapshot.hasBoxContent ? "Edit box" : "Build a Box"}
          </Link>
        </div>
      </header>

      {isEmpty ? (
        <div className="journey-callout" role="status">
          <p>
            Your brief is empty. Shortlist products, configure a box, or use
            Studio — then return here. Fields you type will stay saved.
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

      {(required.length > 0 || recommended.length > 0) && !isEmpty ? (
        <div className="brief-missing" role="status">
          <p className="brief-missing__title">Still needed for a strong quote</p>
          <ul>
            {required.map((item) => (
              <li key={item.id} data-severity="required">
                {item.label}
              </li>
            ))}
            {recommended.map((item) => (
              <li key={item.id} data-severity="recommended">
                {item.label}{" "}
                <span className="brief-missing__optional">(recommended)</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="brief-section" aria-labelledby="brief-products-heading">
        <div className="brief-section__head">
          <h2 id="brief-products-heading">Shortlisted products</h2>
          <p>
            {products.length
              ? `${products.length} product${products.length === 1 ? "" : "s"} · ${units} ${units === 1 ? "unit" : "units"}`
              : "None yet — add from the catalogue"}
          </p>
        </div>
        {products.length === 0 ? (
          <div className="journey-callout">
            <Link href="/gifts">Add products from the catalogue</Link>
            {" · "}
            <Link href="/gifts/shortlist">Open shortlist</Link>
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
                </div>
                <div className="shortlist-row__qty">
                  <label htmlFor={`brief-qty-${item.id}`}>Qty</label>
                  <input
                    id={`brief-qty-${item.id}`}
                    type="number"
                    min={
                      item.minQuantity && item.minQuantity > 0
                        ? item.minQuantity
                        : 1
                    }
                    value={item.quantity}
                    onChange={(event) =>
                      setShortlistQuantity(item.id, Number(event.target.value))
                    }
                  />
                  <button
                    type="button"
                    className="shortlist-row__remove"
                    onClick={() => removeFromShortlist(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="brief-section" aria-labelledby="brief-linked-heading">
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
                  {snapshot.box.products.length === 1 ? "" : "s"} ·{" "}
                  {snapshot.box.customization.numberOfBoxes} box
                  {snapshot.box.customization.numberOfBoxes === 1 ? "" : "es"}
                  {snapshot.box.packaging
                    ? ` · packaging noted`
                    : " · packaging TBD"}
                  {brief.sources.box ? " · linked" : ""}
                </p>
              ) : (
                <p>No box draft yet.</p>
              )}
            </div>
            <Link href="/gifts/box">
              {snapshot.hasBoxContent ? "Review box" : "Start Build a Box"}
            </Link>
          </li>

          <li className="brief-link-card">
            <div>
              <h3>Studio branding</h3>
              {snapshot.hasBrandingContent ? (
                <p>
                  Mockup draft
                  {snapshot.branding.productSlug
                    ? ` · /gifts/${snapshot.branding.productSlug}`
                    : ""}
                  {snapshot.branding.logo
                    ? ` · logo ${snapshot.branding.logo.fileName}`
                    : " · no logo file"}
                  {brief.sources.studioBranding ? " · linked" : ""}
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
              <Link href="/studio">
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
                  {snapshot.catalogue.title || "Untitled draft"} ·{" "}
                  {snapshot.catalogue.productIds.length} product
                  {snapshot.catalogue.productIds.length === 1 ? "" : "s"}
                  {brief.sources.studioCatalogue ? " · linked" : ""}
                </p>
              ) : (
                <p>No reseller catalogue draft yet.</p>
              )}
            </div>
            {snapshot.studioRouteAvailable ? (
              <Link href="/studio">Open Studio catalogue</Link>
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
                    "Untitled store"}{" "}
                  · {snapshot.companyStore.productIds.length} product
                  {snapshot.companyStore.productIds.length === 1 ? "" : "s"}
                  {brief.sources.companyStore ? " · linked" : ""}
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
              <Link href="/company-stores">
                {snapshot.hasCompanyStoreContent
                  ? "Review store draft"
                  : "Explore Company Stores"}
              </Link>
            ) : (
              <span className="brief-link-card__muted">Coming soon</span>
            )}
          </li>
        </ul>
      </section>

      <form className="brief-form" onSubmit={onPrepare} noValidate>
        <section className="brief-section" aria-labelledby="brief-programme-heading">
          <div className="brief-section__head">
            <h2 id="brief-programme-heading">Programme details</h2>
            <p>
              Autosaves as you type, including contact fields. Contact is only
              required when you prepare a quotation.
            </p>
          </div>
          <div className="brief-form__grid">
            <label>
              Occasion
              <input
                name="occasion"
                value={brief.occasion}
                onChange={(event) => updateField("occasion", event.target.value)}
                placeholder="e.g. Employee onboarding, Diwali, client event"
                required
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
        </section>

        <fieldset className="brief-form__contact">
          <legend>Contact (needed when you send the enquiry)</legend>
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
              Work email
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
              Phone
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

        <div className="journey-actions journey-actions--footer">
          <button type="submit" className="journey-btn" disabled={refreshing}>
            {refreshing ? "Preparing…" : "Prepare quotation brief"}
          </button>
          <Link className="journey-btn journey-btn--ghost" href="/gifts/shortlist">
            My shortlist
          </Link>
          <button
            type="button"
            className="journey-btn journey-btn--ghost"
            onClick={() => {
              if (
                window.confirm(
                  "Clear programme fields and linked brief sources? Shortlist and box drafts in other tools are not deleted.",
                )
              ) {
                clearBrief();
                setContact(emptyContact());
              }
            }}
          >
            Clear brief fields
          </button>
        </div>
      </form>
    </div>
  );
}
