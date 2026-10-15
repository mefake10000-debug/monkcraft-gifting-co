"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { getContactChannels } from "@/lib/contactConfig";
import { resolveNavHref } from "@/lib/nav";
import { buildWhatsAppHref } from "@/lib/whatsapp";

type HeaderToolsProps = {
  /** Current pathname for in-page enquire anchors. */
  pathname: string;
  /** Close parent mobile drawer when a tool navigates. */
  onNavigate?: () => void;
  /** Compact icon-first layout for sticky / hero chrome. */
  layout?: "desktop" | "mobile";
};

/**
 * Shared header utilities: catalogue search, honest Ask Monkcraft handoff,
 * coffee/enquire CTA, and WhatsApp only when a verified number is configured.
 */
export function HeaderTools({
  pathname,
  onNavigate,
  layout = "desktop",
}: HeaderToolsProps) {
  const [askOpen, setAskOpen] = useState(false);
  const askPanelId = useId();
  const askWrapRef = useRef<HTMLDivElement>(null);
  const channels = getContactChannels();
  const enquireHref = resolveNavHref("/#enquire", pathname);
  const waHref = channels.hasWhatsApp
    ? buildWhatsAppHref(
        "Hi Monkcraft — I'd like to connect about a corporate gifting programme.",
        channels.whatsappE164,
      )
    : null;

  useEffect(() => {
    if (!askOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAskOpen(false);
    };
    const onPointer = (event: MouseEvent) => {
      if (
        askWrapRef.current &&
        !askWrapRef.current.contains(event.target as Node)
      ) {
        setAskOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [askOpen]);

  function handleNavigate() {
    setAskOpen(false);
    onNavigate?.();
  }

  const rootClass =
    layout === "mobile"
      ? "mc-header-tools mc-header-tools--mobile"
      : "mc-header-tools";

  return (
    <div className={rootClass}>
      <Link
        className="mc-header-tools__item"
        href="/gifts#catalogue-q"
        onClick={handleNavigate}
        title="Search the gift catalogue"
      >
        <SearchIcon />
        <span>Search</span>
      </Link>

      {waHref ? (
        <a
          className="mc-header-tools__item"
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleNavigate}
          title="Opens WhatsApp with a draft — you still tap send"
        >
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
      ) : null}

      <div className="mc-header-tools__ask" ref={askWrapRef}>
        <button
          type="button"
          className="mc-header-tools__item mc-header-tools__ask-btn"
          aria-expanded={askOpen}
          aria-controls={askOpen ? askPanelId : undefined}
          onClick={() => setAskOpen((value) => !value)}
        >
          <AskIcon />
          <span>Ask Monkcraft</span>
        </button>
        {askOpen ? (
          <div
            id={askPanelId}
            className="mc-header-tools__ask-panel"
            role="dialog"
            aria-label="Ask Monkcraft"
          >
            <p className="mc-header-tools__ask-title">Ask Monkcraft</p>
            <p className="mc-header-tools__ask-note">
              Connect with the team — this is not a live AI chatbot.
            </p>
            <ul className="mc-header-tools__ask-links">
              <li>
                {enquireHref.startsWith("#") ? (
                  <a href={enquireHref} onClick={handleNavigate}>
                    Talk to Monkcraft
                  </a>
                ) : (
                  <Link href={enquireHref} onClick={handleNavigate}>
                    Talk to Monkcraft
                  </Link>
                )}
              </li>
              <li>
                <Link href="/gifts/brief" onClick={handleNavigate}>
                  Open My Brief
                </Link>
              </li>
              <li>
                <Link href="/gifts/find" onClick={handleNavigate}>
                  Gift Finder (rule-based)
                </Link>
              </li>
              {waHref ? (
                <li>
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleNavigate}
                  >
                    WhatsApp the team
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>

      {enquireHref.startsWith("#") ? (
        <a
          className="mc-header-tools__coffee"
          href={enquireHref}
          onClick={handleNavigate}
          title="Want to connect over a coffee / know more? We can help."
        >
          Coffee chat
        </a>
      ) : (
        <Link
          className="mc-header-tools__coffee"
          href={enquireHref}
          onClick={handleNavigate}
          title="Want to connect over a coffee / know more? We can help."
        >
          Coffee chat
        </Link>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="mc-header-tools__icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 10.5 14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      className="mc-header-tools__icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 1.75A6.25 6.25 0 0 0 2.4 10.7L1.75 14.25l3.65-.65A6.25 6.25 0 1 0 8 1.75Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M5.6 6.4c.2-.35.4-.4.55-.4h.4c.15 0 .3.05.4.35l.45 1.05c.1.2.05.4-.1.55l-.3.3c-.1.1-.1.25 0 .4.25.45.7.9 1.2 1.15.2.1.35.1.45 0l.4-.4c.15-.15.35-.2.55-.1l1.05.4c.3.1.35.25.35.4v.4c0 .15-.05.35-.4.55-.4.25-1.05.4-2.05.05-1.15-.4-2.15-1.3-2.75-2.45-.3-.55-.4-1.15-.2-1.65Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AskIcon() {
  return (
    <svg
      className="mc-header-tools__icon"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3.5h10v7.25H8.2L5.5 13.2V10.75H3V3.5Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="7" r="0.7" fill="currentColor" />
      <path
        d="M8 5.15c.85 0 1.45.5 1.45 1.2 0 .55-.35.9-.9 1.15-.3.15-.4.3-.4.55v.2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
