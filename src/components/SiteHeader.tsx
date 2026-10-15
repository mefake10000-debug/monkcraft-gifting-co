"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { briefNavCount } from "@/lib/briefWorkspace";
import { boxProductCount, readBoxDraft } from "@/lib/box";
import {
  isNavActive,
  PRIMARY_NAV,
  QUOTE_CTA,
  resolveNavHref,
  UTILITY_NAV,
} from "@/lib/nav";
import { readShortlist } from "@/lib/shortlist";

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [boxCount, setBoxCount] = useState(0);
  const [briefCount, setBriefCount] = useState(0);
  const panelId = useId();

  useEffect(() => {
    const sync = () => {
      setShortlistCount(readShortlist().length);
      setBoxCount(boxProductCount(readBoxDraft()));
      setBriefCount(briefNavCount());
    };
    sync();
    const events = [
      "monkcraft:shortlist",
      "monkcraft:box",
      "monkcraft:brief",
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

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function primaryLabel(label: string) {
    if (label === "Build a Box" && boxCount > 0) {
      return `Build a Box (${boxCount})`;
    }
    return label;
  }

  const quoteCta =
    briefCount > 0 ? QUOTE_CTA.activeLabel(briefCount) : QUOTE_CTA.emptyLabel;

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__logo" href="/" aria-label="Monkcraft home">
          <Image
            src="/brand/Monkcraft-Black-Horizontal.png"
            alt="Monkcraft"
            width={180}
            height={32}
            priority
            className="site-header__logo-image"
          />
        </Link>

        <nav className="site-header__nav" aria-label="Primary">
          <ul className="site-header__links">
            {PRIMARY_NAV.map((link) => {
              const href = resolveNavHref(link.href, pathname);
              const active = isNavActive(pathname, link.href, link.match);
              return (
                <li key={link.label}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                  >
                    {primaryLabel(link.label)}
                  </Link>
                </li>
              );
            })}
            {shortlistCount > 0 ? (
              <li>
                <Link
                  href="/gifts/shortlist"
                  aria-current={
                    pathname.startsWith("/gifts/shortlist") ? "page" : undefined
                  }
                >
                  Shortlist ({shortlistCount})
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>

        <Link
          className="site-header__cta"
          href={QUOTE_CTA.href}
          aria-current={
            pathname.startsWith("/gifts/brief") ? "page" : undefined
          }
        >
          {quoteCta}
        </Link>

        <button
          type="button"
          className="site-header__menu-toggle"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{open ? "Close" : "Menu"}</span>
          <span className="site-header__menu-icon" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>

        {open ? (
          <div id={panelId} className="site-header__mobile-panel">
            <nav aria-label="Mobile primary">
              <ul className="site-header__mobile-links">
                {PRIMARY_NAV.map((link) => (
                  <li key={`m-${link.label}`}>
                    <Link
                      href={resolveNavHref(link.href, pathname)}
                      onClick={() => setOpen(false)}
                      aria-current={
                        isNavActive(pathname, link.href, link.match)
                          ? "page"
                          : undefined
                      }
                    >
                      {primaryLabel(link.label)}
                    </Link>
                  </li>
                ))}
                {UTILITY_NAV.map((link) => (
                  <li key={`m-u-${link.label}`}>
                    <Link
                      href={resolveNavHref(link.href, pathname)}
                      onClick={() => setOpen(false)}
                      className="site-header__mobile-utility"
                    >
                      {link.label === "My Brief" && briefCount > 0
                        ? `My Brief (${briefCount})`
                        : link.label}
                    </Link>
                  </li>
                ))}
                {shortlistCount > 0 ? (
                  <li>
                    <Link
                      href="/gifts/shortlist"
                      onClick={() => setOpen(false)}
                      className="site-header__mobile-utility"
                    >
                      Shortlist ({shortlistCount})
                    </Link>
                  </li>
                ) : null}
              </ul>
              <Link
                className="site-header__mobile-cta"
                href={QUOTE_CTA.href}
                onClick={() => setOpen(false)}
              >
                {briefCount > 0 ? "Continue My Brief" : QUOTE_CTA.emptyLabel}
              </Link>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
