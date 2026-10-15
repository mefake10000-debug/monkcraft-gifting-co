"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { briefNavCount } from "@/lib/briefWorkspace";
import {
  PRIMARY_NAV,
  QUOTE_CTA,
  resolveNavHref,
  UTILITY_NAV,
} from "@/lib/nav";

export function HeroNav() {
  const [open, setOpen] = useState(false);
  const [briefCount, setBriefCount] = useState(0);
  const panelId = useId();
  const pathname = "/";

  useEffect(() => {
    const sync = () => setBriefCount(briefNavCount());
    sync();
    window.addEventListener("monkcraft:brief", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:brief", sync);
      window.removeEventListener("storage", sync);
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

  const quoteCta =
    briefCount > 0 ? QUOTE_CTA.activeLabel(briefCount) : QUOTE_CTA.emptyLabel;

  return (
    <header className="hero__nav">
      <Link className="hero__logo" href="/" aria-label="Monkcraft home">
        <Image
          src="/brand/Monkcraft-Black-Horizontal.png"
          alt="Monkcraft"
          width={180}
          height={32}
          priority
          className="hero__logo-image"
        />
      </Link>

      <nav className="hero__nav-primary" aria-label="Primary">
        <ul className="hero__nav-links">
          {PRIMARY_NAV.map((link) => {
            const href = resolveNavHref(link.href, pathname);
            return (
              <li key={`${link.label}-${link.href}`}>
                {href.startsWith("#") ? (
                  <a href={href}>{link.label}</a>
                ) : (
                  <Link href={href}>{link.label}</Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <Link className="hero__nav-cta" href={QUOTE_CTA.href}>
        {quoteCta}
      </Link>

      <button
        type="button"
        className="hero__menu-toggle"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="hero__menu-toggle-label">{open ? "Close" : "Menu"}</span>
        <span className="hero__menu-toggle-icon" aria-hidden="true">
          <span />
          <span />
        </span>
      </button>

      {open ? (
        <div id={panelId} className="hero__mobile-panel hero__mobile-panel--open">
          <nav aria-label="Mobile primary">
            <ul className="hero__mobile-links">
              {PRIMARY_NAV.map((link) => {
                const href = resolveNavHref(link.href, pathname);
                return (
                  <li key={`m-${link.label}`}>
                    {href.startsWith("#") ? (
                      <a href={href} onClick={() => setOpen(false)}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={href} onClick={() => setOpen(false)}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
              {UTILITY_NAV.map((link) => {
                const href = resolveNavHref(link.href, pathname);
                return (
                  <li key={`m-u-${link.label}`}>
                    {href.startsWith("#") ? (
                      <a
                        href={href}
                        onClick={() => setOpen(false)}
                      >
                        {link.label === "My Brief" && briefCount > 0
                          ? `My Brief (${briefCount})`
                          : link.label}
                      </a>
                    ) : (
                      <Link href={href} onClick={() => setOpen(false)}>
                        {link.label === "My Brief" && briefCount > 0
                          ? `My Brief (${briefCount})`
                          : link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
            <Link
              className="hero__btn hero__btn--primary hero__mobile-cta"
              href={QUOTE_CTA.href}
              onClick={() => setOpen(false)}
            >
              {briefCount > 0 ? "Continue My Brief" : QUOTE_CTA.emptyLabel}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
