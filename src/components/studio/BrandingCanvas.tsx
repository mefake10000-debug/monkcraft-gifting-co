"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { BrandingTransform } from "@/data/catalogue/studioTypes";

export function focusBrandingTarget(
  id: string,
  root: Pick<Document, "getElementById" | "defaultView"> = document,
): boolean {
  const target = root.getElementById(id);
  if (!target) return false;
  const reduceMotion = root.defaultView?.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  target.focus({ preventScroll: true });
  return true;
}

type BrandingCanvasProps = {
  productImageSrc?: string;
  productImageAlt?: string;
  logoDataUrl?: string;
  transform: BrandingTransform;
  text?: string;
  textEnabled?: boolean;
  onTransformChange: (next: BrandingTransform) => void;
  /** Fired once when a drag or keyboard nudge session begins (for undo). */
  onTransformGestureStart?: () => void;
};

export function BrandingCanvas({
  productImageSrc,
  productImageAlt = "",
  logoDataUrl,
  transform,
  text,
  textEnabled,
  onTransformChange,
  onTransformGestureStart,
}: BrandingCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number, origin: { x: number; y: number; ox: number; oy: number }) => {
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const dx = (clientX - origin.ox) / rect.width;
      const dy = (clientY - origin.oy) / rect.height;
      onTransformChange({
        ...transform,
        x: Math.min(0.98, Math.max(0.02, origin.x + dx)),
        y: Math.min(0.98, Math.max(0.02, origin.y + dy)),
      });
    },
    [onTransformChange, transform],
  );

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!logoDataUrl) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onTransformGestureStart?.();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transform.x,
      originY: transform.y,
    };
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    updateFromClient(event.clientX, event.clientY, {
      x: drag.originX,
      y: drag.originY,
      ox: drag.startX,
      oy: drag.startY,
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  }

  // Keep logo position correct when the stage resizes (fractional coords)
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      // Fractional layout — no coordinate rewrite needed; force style recalc
      stage.style.setProperty("--studio-logo-x", String(transform.x));
      stage.style.setProperty("--studio-logo-y", String(transform.y));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, [transform.x, transform.y]);

  return (
    <div className="studio-canvas">
      <div
        ref={stageRef}
        className={
          dragging
            ? "studio-canvas__stage studio-canvas__stage--dragging"
            : "studio-canvas__stage"
        }
        style={
          {
            "--studio-logo-x": transform.x,
            "--studio-logo-y": transform.y,
            "--studio-logo-scale": transform.scale,
            "--studio-logo-rotation": `${transform.rotation}deg`,
          } as CSSProperties
        }
      >
        {productImageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- canvas export needs same-origin <img>; Next/Image optimizes away
          <img
            className="studio-canvas__product"
            src={productImageSrc}
            alt={productImageAlt}
            draggable={false}
          />
        ) : (
          <div className="studio-canvas__empty" role="status">
            <p className="studio-canvas__empty-title">
              Select a product to preview branding
            </p>
            <p>Choose a product from the catalogue, then upload your logo.</p>
          </div>
        )}

        {logoDataUrl ? (
          <div
            id="studio-logo-position"
            className="studio-canvas__logo"
            role="slider"
            tabIndex={0}
            aria-label="Logo position. Use arrow keys to nudge."
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(transform.x * 100)}
            aria-valuetext={`Horizontal ${Math.round(transform.x * 100)} percent, vertical ${Math.round(transform.y * 100)} percent`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 0.04 : 0.015;
              let { x, y } = transform;
              if (event.key === "ArrowLeft") x -= step;
              else if (event.key === "ArrowRight") x += step;
              else if (event.key === "ArrowUp") y -= step;
              else if (event.key === "ArrowDown") y += step;
              else return;
              event.preventDefault();
              onTransformGestureStart?.();
              onTransformChange({
                ...transform,
                x: Math.min(0.98, Math.max(0.02, x)),
                y: Math.min(0.98, Math.max(0.02, y)),
              });
            }}
          >
            {/* Logo always as <img> — SVG never injected as markup */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoDataUrl} alt="" draggable={false} />
          </div>
        ) : null}

        {textEnabled && text?.trim() ? (
          <p className="studio-canvas__text">{text.trim()}</p>
        ) : null}

        <p className="studio-canvas__badge">
          Conceptual mockup — not a print proof
        </p>
      </div>
    </div>
  );
}
