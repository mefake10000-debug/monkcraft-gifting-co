'use client';
import {useEffect, useRef, type ReactNode} from 'react';
/** Native top-layer dialog provides inert background, focus containment and Escape. */
export function Drawer({open, onClose, title, children, footer}: {open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previous = document.body.style.overflow;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const mq = window.matchMedia('(min-width:1100px)');
    const resize = () => { if (mq.matches && title === 'Menu') closeRef.current(); };
    mq.addEventListener('change', resize);
    return () => { mq.removeEventListener('change', resize); dialog.close(); document.body.style.overflow = previous; trigger?.focus({preventScroll:true}); };
  }, [open, title]);
  if (!open) return null;
  return <dialog ref={ref} className="mc-drawer" aria-label={title} onCancel={event => {event.preventDefault(); onClose();}} onClick={event => {if (event.target === event.currentTarget) onClose();}}>
    <div className="mc-drawer__frame">
      <div className="mc-drawer__head"><h2>{title}</h2><button type="button" className="mc-text-button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>Close ×</button></div>
      <div className="mc-drawer__content">{children}</div>
      {footer && <div className="mc-drawer__footer">{footer}</div>}
    </div>
  </dialog>;
}
