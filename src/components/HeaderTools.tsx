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
            <path d="M20.1 3.9A10.8 10.8 0 0 0 3.2 16.8L2 22l5.3-1.2a10.8 10.8 0 0 0 12.8-16.9ZM12 20a8.9 8.9 0 0 1-4.5-1.2l-.3-.2-3.1.7.7-3-.2-.3A9 9 0 1 1 12 20Zm5-6.7c-.3-.2-1.7-.9-2-.9-.2-.1-.4-.2-.6.2s-.7.9-.8 1.1-.3.2-.6.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.5.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.8.4s-1 1-1 2.3 1 2.7 1.2 2.9c.1.2 2 3.2 5 4.4.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.4.2-.7.2-1.3.2-1.4s-.2-.3-.5-.4Z" />
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
