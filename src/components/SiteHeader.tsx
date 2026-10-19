'use client';
import Image from 'next/image';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useState} from 'react';
import {HeaderTools} from './HeaderTools';
import {Drawer} from './ui/Drawer';
import {readShortlist} from '@/lib/shortlist';
import {PRIMARY_NAV,isNavActive} from '@/lib/nav';
import {readBoxDraft} from '@/lib/box';
import {readFavouriteIds} from '@/lib/favourites';
export function SiteHeader({hero=false}:{hero?:boolean}) {
 const pathname=usePathname()||'/';const [open,setOpen]=useState(false);const [count,setCount]=useState(0);const [boxCount,setBoxCount]=useState(0);const [favouriteCount,setFavouriteCount]=useState(0);
 useEffect(()=>{const sync=()=>{setCount(readShortlist().length);setBoxCount(readBoxDraft().products.length);setFavouriteCount(readFavouriteIds().length);};sync();const events=['monkcraft:shortlist','monkcraft:box','monkcraft:favourites','monkcraft:brief','monkcraft:compare','monkcraft:studio-branding','monkcraft:studio-catalogue','monkcraft:company-store-draft','storage'];events.forEach(e=>window.addEventListener(e,sync));return ()=>events.forEach(e=>window.removeEventListener(e,sync));},[]);
 return <header className={`site-header${hero?' site-header--hero':''}`}><div className="site-header__inner">
 <Link className="site-header__logo" href="/" aria-label="Monkcraft home"><Image src="/brand/Monkcraft-Black-Horizontal.png" alt="Monkcraft" width={180} height={32} priority className="site-header__logo-image"/></Link>
 <nav className="site-header__nav" aria-label="Primary"><ul className="site-header__links">{PRIMARY_NAV.map(item=><li key={item.href}><Link href={item.href} aria-current={isNavActive(pathname,item.href,item.match)?'page':undefined}>{item.label}</Link></li>)}</ul></nav>
 <div className="site-header__end"><Link className="site-header__search" href="/gifts#catalogue-q" aria-label="Search catalogue" title="Search catalogue"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.4"/><path d="m15.5 15.5 5 5"/></svg><span className="visually-hidden">Search catalogue</span></Link><div className="site-header__tools-desktop"><HeaderTools pathname={pathname}/></div><Link className="site-header__favourites" href="/gifts/favourites" aria-label={`Saved gifts${favouriteCount?` (${favouriteCount})`:''}`}>☆{favouriteCount?` ${favouriteCount}`:''}</Link>{boxCount>0?<Link className="site-header__box-link" href="/gifts/box" aria-label={`Open your gift box with ${boxCount} products`}>Gift box <span>{boxCount}</span></Link>:null}<Link className="site-header__cta site-header__brief-link" href={count>0?"/gifts/shortlist":"/gifts/brief"} aria-label={count>0?`Open quote selections, ${count} products`:"Open My Brief"} title={count>0?"Quote selections":"My Brief"}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 8.5h15l-1 12h-13l-1-12Z"/><path d="M8 9V6.5a4 4 0 0 1 8 0V9"/></svg><span className="site-header__brief-label">{count>0?`My Brief (${count})`:"My Brief"}</span></Link><button type="button" className="site-header__menu-toggle" aria-expanded={open} onClick={()=>setOpen(true)}>Menu ☰</button></div>
 <Drawer open={open} onClose={()=>setOpen(false)} title="Menu"><nav className="clean-mobile-nav" aria-label="Mobile primary">{PRIMARY_NAV.map(item=><Link key={item.href} href={item.href} aria-current={isNavActive(pathname,item.href,item.match)?'page':undefined} onClick={()=>setOpen(false)}>{item.label}</Link>)}<Link href="/gifts#catalogue-q" onClick={()=>setOpen(false)}>Search catalogue</Link><Link href="/gifts/favourites" onClick={()=>setOpen(false)}>Saved gifts {favouriteCount?`(${favouriteCount})`:''}</Link><Link href={count>0?"/gifts/shortlist":"/gifts/brief"} onClick={()=>setOpen(false)}>{count?`Quote selections (${count})`:"My Brief"}</Link><hr/><HeaderTools pathname={pathname} layout="mobile" onNavigate={()=>setOpen(false)}/></nav></Drawer>
 </div></header>;
}
