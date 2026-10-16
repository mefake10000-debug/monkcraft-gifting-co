'use client';
import {useEffect, useId, useRef, useState} from 'react';
import type {CatalogueFacet, CatalogueQuery} from '@/data/catalogue/types';
import {parseBudgetRange, toggleListValue} from '@/data/catalogue/queryParams';
export type FacetKey = 'categories' | 'brands' | 'occasions' | 'brandings' | 'colours' | 'materials';
export type FilterFacets = Record<FacetKey, CatalogueFacet[]>;
export const FILTER_GROUPS: {key: FacetKey; label: string}[] = [{key:'categories',label:'Category'},{key:'brands',label:'Brand'},{key:'occasions',label:'Occasion'},{key:'brandings',label:'Customisation'},{key:'colours',label:'Colour'},{key:'materials',label:'Material'}];
export function CatalogueFilters({query, facets, onChange, groups, onGroupChange, onValidityChange, staged=false}: {query:CatalogueQuery; staged?:boolean; facets:FilterFacets; onChange:(patch:Partial<CatalogueQuery>)=>void; groups:Record<string,boolean>; onGroupChange:(key:string,open:boolean)=>void; onValidityChange?:(valid:boolean)=>void}) {
  return <div className="refine-filters">
    <FacetGroup group={FILTER_GROUPS[0]} query={query} facets={facets.categories} onChange={onChange} open={groups.categories ?? false} onOpen={onGroupChange}/>
    <FacetGroup group={FILTER_GROUPS[1]} query={query} facets={facets.brands} onChange={onChange} open={groups.brands ?? false} onOpen={onGroupChange}/>
    <BudgetFields query={query} staged={staged} onChange={onChange} open={groups.budget ?? false} onOpen={onGroupChange} onValidityChange={onValidityChange}/>
    {FILTER_GROUPS.slice(2).map(group=><FacetGroup key={group.key} group={group} query={query} facets={facets[group.key]} onChange={onChange} open={groups[group.key] ?? false} onOpen={onGroupChange}/>)}
  </div>;
}
function FacetGroup({group,query,facets,onChange,open,onOpen}: {group:{key:FacetKey;label:string}; query:CatalogueQuery;facets:CatalogueFacet[];onChange:(patch:Partial<CatalogueQuery>)=>void;open:boolean;onOpen:(key:string,value:boolean)=>void}) {
 const [needle,setNeedle]=useState(''); const id=useId();
 const selected=query[group.key];
 const visible=facets.filter(f=>(f.count || selected.includes(f.id)) && f.label.toLowerCase().includes(needle.toLowerCase()));
 return <section className="refine-group">
   <button type="button" className="refine-group__toggle" aria-expanded={open} aria-controls={id} onClick={()=>onOpen(group.key,!open)}>{group.label}<span>{selected.length ? `${selected.length} selected` : ''} {open?'−':'+'}</span></button>
   <div id={id} hidden={!open}>
    {facets.length>10 && <input className="refine-search" type="search" placeholder={`Search ${group.label.toLowerCase()}`} aria-label={`Search ${group.label}`} value={needle} onChange={e=>setNeedle(e.target.value)}/>}
    <ul className="refine-options">{visible.map(f=><li key={f.id}><label><input type="checkbox" checked={selected.includes(f.id)} onChange={()=>onChange({[group.key]:toggleListValue(selected,f.id),...(group.key==='categories'?{subcategories:[]}:{} )})}/><span>{f.label}</span><small>{f.count?.toLocaleString('en-IN') ?? 0}</small></label></li>)}</ul>
    {!visible.length && <p className="refine-note">No matching options.</p>}
   </div>
 </section>;
}
function BudgetFields({query,onChange,open,onOpen,onValidityChange,staged}: {staged:boolean;query:CatalogueQuery;onChange:(patch:Partial<CatalogueQuery>)=>void;open:boolean;onOpen:(key:string,value:boolean)=>void;onValidityChange?:(valid:boolean)=>void}) {
 const [min,setMin]=useState(query.budgetMinInr?.toString()??'');const [max,setMax]=useState(query.budgetMaxInr?.toString()??'');
 const [previous,setPrevious]=useState({min:query.budgetMinInr,max:query.budgetMaxInr});
 if(previous.min!==query.budgetMinInr||previous.max!==query.budgetMaxInr){setPrevious({min:query.budgetMinInr,max:query.budgetMaxInr});setMin(query.budgetMinInr?.toString()??'');setMax(query.budgetMaxInr?.toString()??'');}
 const id=useId(); const callback=useRef(onChange);const validity=useRef(onValidityChange);
 useEffect(()=>{callback.current=onChange;validity.current=onValidityChange;},[onChange,onValidityChange]);
 const {min:lo,max:hi,valid}=parseBudgetRange(min,max);
 const commit=()=>{if(valid && (lo!==query.budgetMinInr||hi!==query.budgetMaxInr)) callback.current({budgetMinInr:lo,budgetMaxInr:hi});};
 useEffect(()=>{validity.current?.(valid);if(!valid) return;const timer=setTimeout(()=>{if(lo!==query.budgetMinInr||hi!==query.budgetMaxInr) callback.current({budgetMinInr:lo,budgetMaxInr:hi});},400);return ()=>clearTimeout(timer);},[lo,hi,valid,query.budgetMinInr,query.budgetMaxInr]);
 return <section className="refine-group"><button type="button" className="refine-group__toggle" aria-expanded={open} aria-controls={id} onClick={()=>onOpen('budget',!open)}>Budget per gift <span>{open?'−':'+'}</span></button><div id={id} hidden={!open}>
 <div className="refine-budget">{[{label:'Min (₹)',value:min,set:setMin},{label:'Max (₹)',value:max,set:setMax}].map(field=><label key={field.label}>{field.label}<input type="number" inputMode="numeric" min="1" step="1" placeholder="Any" value={field.value} aria-invalid={!valid} aria-describedby={!valid?`${id}-error`:undefined} onChange={e=>{const value=e.target.value;field.set(value);if(staged){const range=parseBudgetRange(field.label==='Min (₹)'?value:min,field.label==='Max (₹)'?value:max);onValidityChange?.(range.valid);if(range.valid)onChange({budgetMinInr:range.min,budgetMaxInr:range.max});}}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit();}}}/></label>)}</div>
 {!valid?<p id={`${id}-error`} role="alert" className="refine-error">Enter positive whole amounts, with Min no higher than Max.</p>:<p className="refine-note">Catalogue unit prices. Taxes and customisation may be extra.</p>}
 </div></section>;
}
