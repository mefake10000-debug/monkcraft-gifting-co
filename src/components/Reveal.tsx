"use client";

import {
  createElement,
  useCallback,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type RevealVariant = "up" | "fade" | "scale" | "left" | "right";

type RevealProps = {
  children: ReactNode;
  /** Element to render. Defaults to a div. */
  as?: ElementType;
  /** Motion direction. Defaults to "up". */
  variant?: RevealVariant;
  /** Stagger delay in milliseconds. */
  delayMs?: number;
  /** Extra classes appended after the reveal classes. */
  className?: string;
  style?: CSSProperties;
  id?: string;
} & Record<string, unknown>;

/**
 * Reveals its children once when scrolled into view.
 *
 * The hidden state lives behind `html.mc-motion` (added pre-paint in the root
 * layout only when JS runs and motion is allowed), so with JS disabled or
 * `prefers-reduced-motion: reduce` the content renders fully visible.
 */
export function Reveal({
  children,
  as = "div",
  variant = "up",
  delayMs = 0,
  className,
  style,
  id,
  ...rest
}: RevealProps) {
  const [shown, setShown] = useState(false);

  const attach = useCallback(
    (node: HTMLElement | null) => {
      if (!node || shown) return;
      if (typeof IntersectionObserver === "undefined") return;
      if (!document.documentElement.classList.contains("mc-motion")) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setShown(true);
              observer.disconnect();
            }
          }
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
      );

      observer.observe(node);
      return () => observer.disconnect();
    },
    [shown],
  );

  const classes = [
    "mc-reveal",
    variant !== "up" ? `mc-reveal--${variant}` : "",
    shown ? "is-inview" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const mergedStyle: CSSProperties | undefined = delayMs
    ? { transitionDelay: `${delayMs}ms`, ...style }
    : style;

  return createElement(
    as,
    { ref: attach, className: classes, style: mergedStyle, id, ...rest },
    children,
  );
}
