'use client';
import Link from 'next/link';
import {useEffect, useMemo, useRef, useState, useTransition} from 'react';
import {useRouter} from 'next/navigation';
import type {CatalogueFacet, CatalogueQuery, Product} from '@/data/catalogue/types';
import {buildCatalogueHref,countActiveFilters,emptyCatalogueQuery,toggleListValue} from '@/data/catalogue/queryParams';
import {readShortlistIds} from '@/lib/shortlist';
import {readCatalogueBrowse,saveCatalogueBrowse} from '@/lib/catalogueBrowsing';
import {getPaginationItems} from '@/lib/pagination';
import {Drawer} from '@/components/ui/Drawer';
import {CatalogueFilters,FILTER_GROUPS,type FilterFacets} from './CatalogueFilters';
import {CatalogueToolbar} from './CatalogueToolbar';
import {ProductCard} from './ProductCard';
import {CatalogueEmpty} from './CatalogueEmpty';
export type CatalogueShellProps={products:Product[];total:number;page:number;pageSize:number;totalPages:number;query:CatalogueQuery;occasionFacets:CatalogueFacet[];categoryFacets:CatalogueFacet[];subcategoryFacetsByCategory:Record<string,CatalogueFacet[]>;brandFacets:CatalogueFacet[];colourFacets:CatalogueFacet[];materialFacets:CatalogueFacet[];cataloguePopulated:boolean;fromBox?:boolean;basePath?:string};
export function CatalogueShell(props:CatalogueShellProps) {
 const router=useRouter();const [pending,startTransition]=useTransition();
 const [query,setQuery]=useState(props.query);const queryRef=useRef(query);const pendingHref=useRef<string|null>(null);
 const [groups,setGroups]=useState<Record<string,boolean>>({});const groupsRef=useRef(groups);
 const [sheet,setSheet]=useState<CatalogueQuery|null>(null);const [sheetGroups,setSheetGroups]=useState<Record<string,boolean>>({});
 const [sheetValid,setSheetValid]=useState(true);const [preview,setPreview]=useState<(FilterFacets & {total:number})|null>(null);const [previewError,setPreviewError]=useState(false);
 const [desktopFilterRevision,setDesktopFilterRevision]=useState(0);const [sheetFilterRevision,setSheetFilterRevision]=useState(0);
 const [shortlistIds,setShortlistIds]=useState<string[]>([]);
 const pendingScroll=useRef(false);const headingRef=useRef<HTMLHeadingElement>(null);const firstResultRef=useRef<HTMLLIElement>(null);
 const initialFacets=useMemo(()=>({categories:props.categoryFacets,brands:props.brandFacets,occasions:props.occasionFacets,colours:props.colourFacets,materials:props.materialFacets}),[props.categoryFacets,props.brandFacets,props.occasionFacets,props.colourFacets,props.materialFacets]);
 const basePath=props.basePath??"/gifts";
 const hrefFor=(next:CatalogueQuery)=>{const href=buildCatalogueHref(next,basePath);return props.fromBox?`${href}${href.includes('?')?'&':'?'}from=box`:href;};
 const hrefRef=useRef(hrefFor(query));
 useEffect(()=>{
   const href=buildCatalogueHref(props.query,basePath);
   if(pendingHref.current && pendingHref.current!==href) return;
   pendingHref.current=null;queryRef.current=props.query;
   const sync=()=>setQuery(props.query);sync();
   if(pendingScroll.current){pendingScroll.current=false;requestAnimationFrame(()=>{const target=firstResultRef.current??headingRef.current;target?.scrollIntoView({block:'start',behavior:'instant'});target?.focus({preventScroll:true});});}
 },[props.query,props.page,basePath]);
 useEffect(()=>{const sync=()=>setShortlistIds([...readShortlistIds()]);sync();window.addEventListener('monkcraft:shortlist',sync);window.addEventListener('storage',sync);return ()=>{window.removeEventListener('monkcraft:shortlist',sync);window.removeEventListener('storage',sync);};},[]);
 useEffect(()=>{
   const href=window.location.pathname+window.location.search;hrefRef.current=href;
   const saved=readCatalogueBrowse(href);
   if(saved){const restore=()=>{groupsRef.current={};setGroups({});requestAnimationFrame(()=>requestAnimationFrame(()=>{const anchor=saved.anchorId?document.getElementById(saved.anchorId):null;window.scrollTo({top:anchor&&saved.anchorOffset!==undefined?anchor.getBoundingClientRect().top+window.scrollY-saved.anchorOffset:saved.scrollY,behavior:'instant'});}));};restore();}
   let timer:ReturnType<typeof setTimeout>|undefined;
   const save=()=>{const visible=[...document.querySelectorAll<HTMLElement>('[data-product-id]')].find(el=>el.getBoundingClientRect().bottom>100);saveCatalogueBrowse(hrefRef.current,{scrollY:window.scrollY,anchorId:visible?.id,anchorOffset:visible?.getBoundingClientRect().top,groups:groupsRef.current});};
   const scroll=()=>{clearTimeout(timer);timer=setTimeout(save,120);};
   const pop=()=>{pendingHref.current=null;pendingScroll.current=true;};
   document.addEventListener('click',save,true);window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('popstate',pop);
   return ()=>{clearTimeout(timer);document.removeEventListener('click',save,true);window.removeEventListener('scroll',scroll);window.removeEventListener('popstate',pop);};
 },[]);
 useEffect(()=>{hrefRef.current=window.location.pathname+window.location.search;},[props.query]);
 useEffect(()=>{
   if(!sheet) return;const controller=new AbortController();
   const timer=setTimeout(async()=>{try{const res=await fetch('/api/catalogue/facets'+buildCatalogueHref(sheet).slice('/gifts'.length),{signal:controller.signal});if(!res.ok) throw new Error('Preview unavailable');const value=await res.json();if(!controller.signal.aborted){setPreview(value);setPreviewError(false);}}catch{if(!controller.signal.aborted){setPreview(null);setPreviewError(true);}}},200);
   return ()=>{clearTimeout(timer);controller.abort();};
 },[sheet]);
 function commit(patch:Partial<CatalogueQuery>,scroll=false){
   const next={...queryRef.current,...patch,page:patch.page??1};
   if('shortlistedOnly' in patch) next.shortlistIds=patch.shortlistedOnly?[...readShortlistIds()]:[];
   queryRef.current=next;setQuery(next);const href=hrefFor(next);pendingHref.current=buildCatalogueHref(next,basePath);pendingScroll.current=scroll;
   startTransition(()=>router.push(href,{scroll:false}));
 }
 function changeSheet(patch:Partial<CatalogueQuery>){setPreview(null);setPreviewError(false);setSheet(current=>current?{...current,...patch,page:1}:current);}
 function clearDesktopFilters(){setDesktopFilterRevision(value=>value+1);groupsRef.current={};setGroups({});commit(emptyCatalogueQuery());}
 function clearSheetFilters(){setSheetFilterRevision(value=>value+1);setSheetGroups({});setSheetValid(true);setPreview(null);setPreviewError(false);setSheet(emptyCatalogueQuery());}
 function changeGroup(key:string,open:boolean){const next={...groupsRef.current,[key]:open};groupsRef.current=next;setGroups(next);}
 const activeCount=countActiveFilters(query);
 return <div className={`catalogue-shell browse-shell${props.fromBox ? " browse-shell--box-context" : ""}`}>
  <aside className="catalogue-shell__sidebar browse-rail" aria-label="Catalogue filters"><div className="browse-rail__title"><h2>Refine your search</h2>{activeCount>0&&<button type="button" onClick={clearDesktopFilters}>Clear filters</button>}</div><CatalogueFilters key={desktopFilterRevision} query={query} facets={initialFacets} onChange={patch=>commit(patch)} groups={groups} onGroupChange={changeGroup}/></aside>
  <div className="catalogue-shell__main" aria-busy={pending}>
   {props.fromBox&&<div className="browse-context"><span>Choose gifts for your box. Add as many as you like.</span>{basePath!=="/gifts/box"&&<Link href="/gifts/box">Review box →</Link>}</div>}
   <CatalogueToolbar query={query} onChange={patch=>commit(patch)} activeCount={activeCount} categoryFacets={props.categoryFacets} subcategoryFacetsByCategory={props.subcategoryFacetsByCategory} onFilters={()=>{setSheet({...queryRef.current});setSheetGroups({...groupsRef.current});setPreview({...initialFacets,total:props.total});setPreviewError(false);setSheetValid(true);}}/>
   <div className="browse-results-heading"><h2 ref={headingRef} tabIndex={-1} id="browse-result-heading">{pending?'Updating gifts…':`${props.total.toLocaleString('en-IN')} gifts`}</h2>{props.totalPages>1&&<span>Page {props.page} of {props.totalPages}</span>}</div>
   {activeCount>0&&<div className="browse-chips" aria-label="Active filters">
    {query.q&&<button onClick={()=>commit({q:''})} aria-label={`Remove search ${query.q}`}>“{query.q}” ×</button>}
    {FILTER_GROUPS.flatMap(g=>query[g.key].map(id=><button key={`${g.key}-${id}`} onClick={()=>commit({[g.key]:toggleListValue(query[g.key],id),...(g.key==='categories'?{subcategories:[]}: {})})} aria-label={`Remove ${initialFacets[g.key].find(f=>f.id===id)?.label??id}`} >{initialFacets[g.key].find(f=>f.id===id)?.label??id} ×</button>))}
    {query.subcategories.map(id=>{const label=Object.values(props.subcategoryFacetsByCategory).flat().find(facet=>facet.id===id)?.label??id;return <button key={id} aria-label={`Remove ${label}`} onClick={()=>commit({subcategories:query.subcategories.filter(v=>v!==id)})}>{label} ×</button>;})}
    {(query.budgetMinInr!==null||query.budgetMaxInr!==null)&&<button onClick={()=>commit({budgetMinInr:null,budgetMaxInr:null})}>₹{query.budgetMinInr??0}–{query.budgetMaxInr??'any'} ×</button>}
    {query.shortlistedOnly&&<button onClick={()=>commit({shortlistedOnly:false,shortlistIds:[]})}>Shortlisted ×</button>}
    <button className="browse-clear" onClick={clearDesktopFilters}>Clear all</button>
   </div>}
   {props.products.length?<ul className="catalogue-grid">{props.products.map((product,index)=><li key={product.id} id={`gift-${product.id}`} data-product-id={product.id} tabIndex={index===0?-1:undefined} ref={index===0?firstResultRef:undefined}><ProductCard product={product} shortlisted={shortlistIds.includes(product.id)} fromBox={props.fromBox}/></li>)}</ul>:<CatalogueEmpty hasActiveFilters={activeCount>0} onClearHref={hrefFor(emptyCatalogueQuery())}/>}
   {props.totalPages>1&&<nav className="catalogue-pagination" aria-label="Catalogue pages">
    <button type="button" aria-label="Previous page" disabled={props.page<=1||pending} onClick={()=>commit({page:props.page-1},true)}>Previous</button>
    <div className="catalogue-pagination__numbers" role="group" aria-label="Choose a page">
     {getPaginationItems(props.page,props.totalPages).map((item,index)=>item==='ellipsis'
      ?<span key={`ellipsis-${index}`} className="catalogue-pagination__ellipsis" aria-hidden="true">…</span>
      :<button key={item} type="button" aria-label={`Page ${item}`} aria-current={item===props.page?'page':undefined} disabled={pending} onClick={()=>commit({page:item},true)}>{item}</button>)}
    </div>
    <span className="catalogue-pagination__status">Page {props.page} of {props.totalPages}</span>
    <button type="button" aria-label="Next page" disabled={props.page>=props.totalPages||pending} onClick={()=>commit({page:props.page+1},true)}>Next</button>
   </nav>}
  </div>
  <Drawer open={sheet!==null} onClose={()=>setSheet(null)} title="Filters" footer={<><button className="mc-text-button" type="button" onClick={clearSheetFilters}>Clear filters</button><button className="mc-btn" disabled={!sheetValid||!preview||previewError} type="button" onClick={()=>{if(sheet){groupsRef.current=sheetGroups;setGroups(sheetGroups);commit(sheet,true);setSheet(null);}}}>{previewError?'Could not load results':preview?`Show ${preview.total.toLocaleString('en-IN')} results`:'Counting results…'}</button>{previewError&&<button type="button" className="mc-text-button" onClick={()=>setSheet(current=>current?{...current}:null)}>Retry</button>}</>}>
   {sheet&&<CatalogueFilters key={sheetFilterRevision} staged query={sheet} facets={preview??initialFacets} onChange={changeSheet} groups={sheetGroups} onGroupChange={(key,open)=>setSheetGroups(current=>({...current,[key]:open}))} onValidityChange={setSheetValid}/>}
  </Drawer>
 </div>;
}
