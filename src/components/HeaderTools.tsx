'use client';

import { useEffect, useRef } from 'react';
import { getContactChannels } from '@/lib/contactConfig';
import { buildWhatsAppHref, buildWhatsAppPrefillMessage } from '@/lib/whatsapp';

export function HeaderTools({ onNavigate, layout = 'desktop' }: { pathname: string; onNavigate?: () => void; layout?: 'desktop' | 'mobile' }) {
  const channels = getContactChannels();
  const ref = useRef<HTMLDetailsElement>(null);
  const introMessage = buildWhatsAppPrefillMessage({
    occasion: 'Corporate gifting',
    notes: 'I would like help choosing the right gifts for my team or clients.',
  });
  const whatsappHref = channels.hasWhatsApp
    ? buildWhatsAppHref(introMessage, channels.whatsappE164)
    : null;

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector('summary')?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) ref.current.open = false;
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', outside);
    };
  }, []);

  const done = () => {
    if (ref.current) ref.current.open = false;
    onNavigate?.();
  };

  return (
    <div className={`mc-header-tools ${layout === 'mobile' ? 'mc-header-tools--mobile' : ''}`}>
      {whatsappHref ? (
        <a
          className="mc-header-tools__item mc-header-tools__call"
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message Monkcraft on WhatsApp with a prefilled enquiry"
          title="Message Monkcraft on WhatsApp"
          onClick={done}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="11" fill="#25D366" />
            <path fill="#fff" d="M17.17 14.39c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.16.19-.33.21-.61.07-.28-.14-1.18-.43-2.24-1.37-.83-.74-1.39-1.66-1.55-1.94-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.49.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.49-.07-.14-.64-1.54-.88-2.11-.23-.55-.46-.47-.64-.48h-.55c-.19 0-.49.07-.75.35-.26.28-.98.96-.98 2.34s1 2.71 1.14 2.9c.14.19 1.97 3.01 4.77 4.22.67.29 1.19.46 1.6.59.67.21 1.28.18 1.76.11.54-.08 1.66-.68 1.89-1.34.24-.66.24-1.22.17-1.34-.07-.12-.26-.19-.54-.33Z" transform="translate(2.65 2.7) scale(.78)" />
          </svg>
          <span className="mc-header-tools__call-label">WhatsApp</span>
        </a>
      ) : null}
      <details ref={ref} className="contact-menu">
        <summary>Need help?</summary>
        <div>
          {channels.enquiryEmail ? <a href={`mailto:${channels.enquiryEmail}`} onClick={done}>Email the team</a> : null}
          {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={done}>WhatsApp the team</a> : null}
        </div>
      </details>
    </div>
  );
}
