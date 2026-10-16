'use client';
import Link from 'next/link';
import {useEffect, useState} from 'react';
import {catalogueReturnHref} from '@/lib/catalogueBrowsing';
export function CatalogueBrowseLink({label, className, fromBox=false}: {label:string;className?:string;fromBox?:boolean}) {
  const [href, setHref] = useState(fromBox?'/gifts?from=box':'/gifts');
  useEffect(() => { const sync = () => setHref(catalogueReturnHref({fromBox})); sync(); }, [fromBox]);
  return <Link className={className} href={href} scroll={false}>{label}</Link>;
}
export function BackToResults({label = 'Back to results'}: {label?: string}) {
  return <CatalogueBrowseLink className="back-to-results" label={label}/>;
}
