'use client';
import {useEffect,useRef} from 'react';
import {getContactChannels} from '@/lib/contactConfig';
import {buildWhatsAppHref} from '@/lib/whatsapp';
export function HeaderTools({onNavigate,layout='desktop'}:{pathname:string;onNavigate?:()=>void;layout?:'desktop'|'mobile'}) {
 const channels=getContactChannels(); const ref=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape'&&ref.current?.open){ref.current.open=false;ref.current.querySelector('summary')?.focus();}};const outside=(e:PointerEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))ref.current.open=false;};document.addEventListener('keydown',close);document.addEventListener('pointerdown',outside);return ()=>{document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',outside);};},[]);
 const done=()=>{if(ref.current)ref.current.open=false;onNavigate?.();};
 return <div className={`mc-header-tools ${layout==='mobile'?'mc-header-tools--mobile':''}`}>
 <a className="mc-header-tools__item mc-header-tools__call" href="tel:+917483221188" aria-label="Call Monkcraft at +91 74832 21188" title="Call Monkcraft" onClick={done}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.7 3.5 9 3c.5-.1 1 .2 1.2.7l1 3c.2.5 0 1.1-.5 1.4L9 9.3a13 13 0 0 0 5.7 5.7l1.2-1.7c.3-.5.9-.7 1.4-.5l3 1c.5.2.8.7.7 1.2l-.5 2.3c-.2 1.1-1.2 1.8-2.3 1.7C10.6 18.4 5.6 13.4 5 5.8c-.1-1.1.6-2.1 1.7-2.3Z"/></svg><span className="mc-header-tools__call-label">Call us</span></a>
 <details ref={ref} className="contact-menu"><summary>Need help?</summary><div>{channels.enquiryEmail&&<a href={`mailto:${channels.enquiryEmail}`} onClick={done}>Email the team</a>}{channels.hasWhatsApp&&<a href={buildWhatsAppHref('Hello Monkcraft, I would like help with corporate gifts.',channels.whatsappE164) ?? undefined} target="_blank" rel="noopener noreferrer" onClick={done}>WhatsApp the team</a>}</div></details>
 </div>;
}
