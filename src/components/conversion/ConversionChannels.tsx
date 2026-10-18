"use client";

import { useEffect, useMemo, useState } from "react";
import { getContactChannels } from "@/lib/contactConfig";
import { buildMailtoHref } from "@/lib/brief";
import {
  createEnquirySubmissionId,
  extractContactFromPrepText,
  submitEnquiryOnline,
} from "@/lib/enquiry/submitClient";
import type {
  EnquiryProductLine,
  EnquiryProgramme,
} from "@/lib/enquiry/types";
import { buildWhatsAppHref } from "@/lib/whatsapp";

export type ConversionChannelsProps = {
  /** Full prepared enquiry / quotation text. */
  prepText: string;
  /** Optional shorter WhatsApp prefill (falls back to truncated prepText). */
  whatsappMessage?: string;
  /** Journey origin for server analytics / email subject context. */
  source?: string;
  /** Structured contact — preferred over parsing prepText. */
  contact?: {
    name: string;
    company: string;
    email?: string;
    phone?: string;
  };
  programme?: EnquiryProgramme;
  products?: EnquiryProductLine[];
  /** Primary copy button label. */
  copyLabel?: string;
  copiedLabel?: string;
  /** Extra secondary links (e.g. edit brief). */
  secondaryActions?: React.ReactNode;
  className?: string;
};

type SubmitState =
  | "idle"
  | "pending"
  | "received"
  | "not_configured"
  | "error";

/**
 * Consistent next-step actions after a prepared enquiry:
 * A compact quote handoff with only configured channels and a copy fallback.
 * Never fake success or invent channels.
 */
export function ConversionChannels({
  prepText,
  whatsappMessage,
  source = "conversion-channels",
  contact: contactProp,
  programme,
  products,
  copyLabel = "Copy enquiry summary",
  copiedLabel = "Copied",
  secondaryActions,
  className,
}: ConversionChannelsProps) {
  const channels = useMemo(() => getContactChannels(), []);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [copyError, setCopyError] = useState("");
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [submissionId] = useState(() =>
    createEnquirySubmissionId(),
  );
  const [requestId, setRequestId] = useState("");
  const [notionSyncPending, setNotionSyncPending] = useState(false);
  const [contactPreference, setContactPreference] = useState<"email" | "phone" | "whatsapp">("email");
  const [whatsappUpdatesOptIn, setWhatsappUpdatesOptIn] = useState(false);
  const [marketingEmailOptIn, setMarketingEmailOptIn] = useState(false);
  const [storageReady, setStorageReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/enquiry")
      .then((res) => res.json())
      .then((data: { storageConfigured?: boolean }) => {
        if (!cancelled) {
          setStorageReady(Boolean(data.storageConfigured));
        }
      })
      .catch(() => {
        if (!cancelled) setStorageReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedContact = useMemo(() => {
    if (contactProp) {
      return {
        name: contactProp.name.trim(),
        company: contactProp.company.trim(),
        email: contactProp.email?.trim() ?? "",
        phone: contactProp.phone?.trim() || "",
      };
    }
    return extractContactFromPrepText(prepText);
  }, [contactProp, prepText]);

  const rawWhatsAppText = whatsappMessage?.trim() || prepText;
  const waText = rawWhatsAppText.slice(0, 1200);
  const whatsappWasTruncated = rawWhatsAppText.length > 1200;
  const waHref = channels.hasWhatsApp
    ? buildWhatsAppHref(waText, channels.whatsappE164)
    : null;
  // Only build mailto when a verified enquiry inbox is configured — never
  // present an empty-To "Request a Quote" as if Monkcraft email were live.
  const mailto = channels.hasEnquiryEmail
    ? buildMailtoHref(prepText, channels.enquiryEmail ?? undefined)
    : null;

  async function copyPrep() {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(prepText);
      setCopyState("copied");
    } catch {
      setCopyError(
        "Could not copy automatically — select the summary text and copy it.",
      );
    }
  }

  async function submitOnline(overrideId?: string) {
    if (submitState === "pending" || submitState === "received") return;
    setSubmitError("");
    setSubmitState("pending");

    const preferredChannelMissing = contactPreference === "email"
      ? !resolvedContact.email
      : !resolvedContact.phone;
    if (!resolvedContact.name || !resolvedContact.company || preferredChannelMissing) {
      setSubmitState("error");
      setSubmitError(
        contactPreference === "email"
          ? "Add a valid email to your quote details, or choose phone or WhatsApp follow-up."
          : "Add a phone number for your selected follow-up channel.",
      );
      return;
    }
    if (contactPreference === "whatsapp" && !whatsappUpdatesOptIn) {
      setSubmitState("error");
      setSubmitError("Select the WhatsApp consent checkbox, or choose email or phone for follow-up.");
      return;
    }
    if (marketingEmailOptIn && !resolvedContact.email) {
      setSubmitState("error");
      setSubmitError("Add an email address if you want product and gifting updates. This choice is optional and does not affect your quote.");
      return;
    }

    const id = overrideId ?? submissionId;
    const { body } = await submitEnquiryOnline({
      name: resolvedContact.name,
      company: resolvedContact.company,
      email: resolvedContact.email,
      phone: resolvedContact.phone,
      contactPreference,
      whatsappUpdatesOptIn,
      marketingEmailOptIn,
      summary: prepText,
      source,
      programme,
      products,
      clientSubmissionId: id,
    });

    if (body.received === true) {
      setRequestId(body.requestId || "");
      setNotionSyncPending(body.notionSyncStatus !== "synced");
      setSubmitState("received");
      return;
    }

    if (body.code === "storage_not_configured") {
      setSubmitState("not_configured");
      setSubmitError(
        body.error ||
          "Quote request storage is not connected yet. Use email or WhatsApp below.",
      );
      return;
    }

    if (body.code === "rate_limited") {
      setSubmitState("error");
      setSubmitError(
        body.error ||
          "Too many attempts. Please wait before retrying, or copy your summary.",
      );
      return;
    }

    setSubmitState("error");
    setSubmitError(
      body.error ||
        "Submission failed — nothing was confirmed saved. You can retry or copy the summary.",
    );
  }

  function retrySubmit() {
    if (submitState === "not_configured" || submitState === "received") return;
    setSubmitError("");
    void submitOnline(submissionId);
  }

  return (
    <div className={className ? `conversion-channels ${className}` : "conversion-channels"}>
      <p className="conversion-channels__status" role="status">
        {submitState === "received" ? (
          <>
            Your quote request was saved. {requestId ? `Reference: ${requestId}. ` : ""}
            Our team will review it before confirming pricing, stock, or delivery.
            {notionSyncPending ? " The internal workspace sync is queued for retry." : ""}
          </>
        ) : storageReady ? (
          <>
            Submit this brief to save it as a quote request. The team will confirm pricing,
            supplier availability, and delivery after review. Email or WhatsApp links
            remain available if you prefer to contact us yourself.
          </>
        ) : channels.hasLiveChannel ? (
          <>
            Online quote request storage is not connected yet. The brief remains in this
            browser until you submit through a contact channel yourself.
          </>
        ) : (
          <>Monkcraft contact channels are being connected. Your quote stays saved in this browser; copy the complete summary to share it.</>
        )}
      </p>

      {submitState !== "received" ? (
        <div className="conversion-channels__preference">
          <label>
            Preferred follow-up
            <select
              value={contactPreference}
              onChange={(event) => setContactPreference(event.target.value as "email" | "phone" | "whatsapp")}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          {contactPreference === "whatsapp" ? (
            <label>
              <input
                type="checkbox"
                checked={whatsappUpdatesOptIn}
                onChange={(event) => setWhatsappUpdatesOptIn(event.target.checked)}
              />
              I agree to receive WhatsApp messages about this quote request.
            </label>
          ) : null}
          <label>
            <input
              type="checkbox"
              checked={marketingEmailOptIn}
              onChange={(event) => setMarketingEmailOptIn(event.target.checked)}
            />
            Email me occasional Monkcraft product and corporate-gifting updates. Optional; separate from this quote. I can withdraw this permission by contacting Monkcraft.
          </label>
        </div>
      ) : null}

      <div className="conversion-channels__actions">
        <button type="button" className="journey-btn" onClick={copyPrep}>
          {copyState === "copied" ? copiedLabel : copyLabel}
        </button>

        {submitState === "received" ? (
          <span className="conversion-channels__disabled" role="status">
            Quote request saved
          </span>
        ) : storageReady === true ? (
          <button
            type="button"
            className="journey-btn journey-btn--ghost"
            onClick={() => void submitOnline()}
            disabled={submitState === "pending"}
          >
            {submitState === "pending"
              ? "Submitting…"
              : "Submit quote request"}
          </button>
        ) : null}

        {mailto ? (
          <a className="journey-btn journey-btn--ghost" href={mailto}>
            Email quote request
          </a>
        ) : null}

        {channels.hasBookingUrl && channels.bookingUrl ? (
          <a
            className="journey-btn journey-btn--ghost"
            href={channels.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a call
          </a>
        ) : null}

        {waHref ? (
          <button
            type="button"
            className="journey-btn journey-btn--ghost"
            onClick={() => setWhatsAppOpen((v) => !v)}
            aria-expanded={whatsAppOpen}
          >
            WhatsApp quote request
          </button>
        ) : null}

        {secondaryActions}
      </div>

      {copyError ? (
        <p className="journey-error" role="alert">
          {copyError}
        </p>
      ) : null}

      {submitError ? (
        <div className="conversion-channels__submit-feedback" role="alert">
          <p className="journey-error">{submitError}</p>
          {submitState === "error" || submitState === "not_configured" ? (
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={retrySubmit}
              disabled={submitState === "not_configured"}
            >
              {submitState === "not_configured" ? "Online submit unavailable" : "Retry submit"}
            </button>
          ) : null}
        </div>
      ) : null}

      {whatsAppOpen && waHref ? (
        <div
          className="conversion-channels__whatsapp"
          role="region"
          aria-label="WhatsApp message preview"
        >
          <h3 className="conversion-channels__whatsapp-title">
            Review before opening WhatsApp
          </h3>
          <p className="conversion-channels__whatsapp-note">
            Opening WhatsApp does not send or deliver a message. Check the draft
            below, then continue in WhatsApp and tap send yourself.
            {whatsappWasTruncated
              ? " This preview is shortened to fit WhatsApp; use “Copy complete quote” above for the full product list and details."
              : ""}
          </p>
          <pre className="journey-preview conversion-channels__wa-preview">
            {waText}
          </pre>
          <div className="conversion-channels__actions">
            <a
              className="journey-btn"
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Continue to WhatsApp
            </a>
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={() => setWhatsAppOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
