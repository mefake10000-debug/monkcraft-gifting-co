"use client";

import Link from "next/link";
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
    email: string;
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
  | "delivered"
  | "not_configured"
  | "error";

/**
 * Consistent next-step actions after a prepared enquiry:
 * Copy → online submit (when server delivery configured) → Request a Quote
 * (mailto) → Book a Consultation → WhatsApp (with customer preview).
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
  const [submissionId, setSubmissionId] = useState(() =>
    createEnquirySubmissionId(),
  );
  const [deliveryReady, setDeliveryReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/enquiry")
      .then((res) => res.json())
      .then((data: { deliveryConfigured?: boolean }) => {
        if (!cancelled) {
          setDeliveryReady(Boolean(data.deliveryConfigured));
        }
      })
      .catch(() => {
        if (!cancelled) setDeliveryReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedContact = useMemo(() => {
    if (
      contactProp?.name?.trim() &&
      contactProp.company?.trim() &&
      contactProp.email?.trim()
    ) {
      return {
        name: contactProp.name.trim(),
        company: contactProp.company.trim(),
        email: contactProp.email.trim(),
        phone: contactProp.phone?.trim() || "",
      };
    }
    return extractContactFromPrepText(prepText);
  }, [contactProp, prepText]);

  const waText = (whatsappMessage?.trim() || prepText).slice(0, 1200);
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
    if (submitState === "pending" || submitState === "delivered") return;
    setSubmitError("");
    setSubmitState("pending");

    if (
      !resolvedContact.name ||
      !resolvedContact.company ||
      !resolvedContact.email
    ) {
      setSubmitState("error");
      setSubmitError(
        "Contact name, company, and work email are required before online submission. Edit your brief and try again.",
      );
      return;
    }

    const id = overrideId ?? submissionId;
    const { body } = await submitEnquiryOnline({
      name: resolvedContact.name,
      company: resolvedContact.company,
      email: resolvedContact.email,
      phone: resolvedContact.phone,
      summary: prepText,
      source,
      programme,
      products,
      clientSubmissionId: id,
    });

    if (body.delivered === true) {
      setSubmitState("delivered");
      return;
    }

    if (body.code === "delivery_not_configured") {
      setSubmitState("not_configured");
      setSubmitError(
        body.error ||
          "Online inbox delivery is not connected yet. Use copy, email, booking, or WhatsApp below.",
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
        "Submission failed — nothing was confirmed delivered. You can retry or copy the summary.",
    );
  }

  function retrySubmit() {
    if (submitState === "not_configured" || submitState === "delivered") return;
    const nextId = createEnquirySubmissionId();
    setSubmissionId(nextId);
    setSubmitError("");
    void submitOnline(nextId);
  }

  return (
    <div className={className ? `conversion-channels ${className}` : "conversion-channels"}>
      <p className="conversion-channels__status" role="status">
        {submitState === "delivered" ? (
          <>
            Your quotation enquiry was accepted by Monkcraft&apos;s delivery
            service. A specialist will follow up using the contact details you
            provided.
          </>
        ) : deliveryReady ? (
          <>
            You can submit this enquiry online, or continue via email, booking,
            or WhatsApp. Opening a channel or copying text does not mean the
            message was sent until you complete that step (or until online
            submit confirms delivery).
          </>
        ) : channels.hasLiveChannel ? (
          <>
            Choose how you want to continue. Online submission to the Monkcraft
            inbox is not connected yet — these actions open a real channel or
            copy your summary. Nothing is sent until you send it yourself.
          </>
        ) : (
          <>
            Online enquiry delivery is not connected yet. Copy the summary below
            and share it with Monkcraft via your usual channel. To activate live
            Request a Quote, Book a Consultation, or WhatsApp, add the verified
            business values in environment configuration (see{" "}
            <code>.env.example</code>).
          </>
        )}
      </p>

      <div className="conversion-channels__actions">
        <button type="button" className="journey-btn" onClick={copyPrep}>
          {copyState === "copied" ? copiedLabel : copyLabel}
        </button>

        {submitState === "delivered" ? (
          <span className="conversion-channels__disabled" role="status">
            Enquiry submitted
          </span>
        ) : deliveryReady === true ? (
          <button
            type="button"
            className="journey-btn journey-btn--ghost"
            onClick={() => void submitOnline()}
            disabled={submitState === "pending"}
          >
            {submitState === "pending"
              ? "Submitting…"
              : "Submit quotation enquiry"}
          </button>
        ) : null}

        {mailto ? (
          <a className="journey-btn journey-btn--ghost" href={mailto}>
            Request a Quote (email)
          </a>
        ) : (
          <span
            className="conversion-channels__disabled"
            title="Enquiry email not configured"
          >
            Request a Quote (email unavailable)
          </span>
        )}

        {channels.hasBookingUrl && channels.bookingUrl ? (
          <a
            className="journey-btn journey-btn--ghost"
            href={channels.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a Consultation
          </a>
        ) : (
          <span
            className="conversion-channels__disabled"
            title="Booking URL not configured"
          >
            Book a Consultation (unavailable)
          </span>
        )}

        {waHref ? (
          <button
            type="button"
            className="journey-btn journey-btn--ghost"
            onClick={() => setWhatsAppOpen((v) => !v)}
            aria-expanded={whatsAppOpen}
          >
            WhatsApp Monkcraft
          </button>
        ) : (
          <span
            className="conversion-channels__disabled"
            title="WhatsApp number not configured"
          >
            WhatsApp Monkcraft (unavailable)
          </span>
        )}

        <Link className="journey-btn journey-btn--ghost" href="/gifts/brief">
          Review gifting brief
        </Link>

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
