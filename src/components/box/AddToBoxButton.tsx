'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import type {BoxProductSnapshot} from '@/data/catalogue/boxTypes';
import {addToBox,getBoxProductQuantity,readBoxDraft,removeFromBox} from '@/lib/box';
export function AddToBoxButton({snapshot,className,variant='card'}:{snapshot:BoxProductSnapshot;className?:string;variant?:'card'|'detail'}) {
 const [qty,setQty]=useState(0);const [justAdded,setJustAdded]=useState(false);const [error,setError]=useState('');const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{const sync=()=>setQty(getBoxProductQuantity(snapshot.id,readBoxDraft()));sync();window.addEventListener('monkcraft:box',sync);window.addEventListener('storage',sync);return ()=>{window.removeEventListener('monkcraft:box',sync);window.removeEventListener('storage',sync);if(timer.current)clearTimeout(timer.current);};},[snapshot.id]);
 return <div className={`add-to-box ${variant==='detail'?'add-to-box--detail':''} ${qty?'add-to-box--active':''} ${className??''}`}>
 {qty?<Link className="add-to-box__btn" href="/gifts/box" aria-label={`Edit ${snapshot.name} in box`}>Edit box</Link>:<button type="button" className="add-to-box__btn" onClick={()=>{try{addToBox(snapshot,1);setQty(1);setJustAdded(true);setError('');if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setJustAdded(false),5000);}catch{setError('Could not save. Please try again.');}}}>Add to Box</button>}
 {justAdded&&qty>0&&<span className="selection-feedback" role="status">Added <button type="button" onClick={()=>{try{removeFromBox(snapshot.id);setQty(0);setJustAdded(false);}catch{setError('Could not undo. Please try again.');}}}>Undo</button></span>}{error&&<span role="alert">{error}</span>}
 </div>;
}
