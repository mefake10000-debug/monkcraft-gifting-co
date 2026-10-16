'use client';
import type {CatalogueQuery} from '@/data/catalogue/types';

export function CatalogueToolbar({query,onChange,onFilters,activeCount}: {
  query:CatalogueQuery;
  onChange:(patch:Partial<CatalogueQuery>)=>void;
  onFilters:()=>void;
  activeCount:number;
}) {
  return <div className="browse-toolbar">
    <form role="search" onSubmit={e=>{
      e.preventDefault();
      onChange({q:String(new FormData(e.currentTarget).get('q')||'').trim()});
    }}>
      <label className="visually-hidden" htmlFor="catalogue-q">Search gifts</label>
      <input key={query.q} defaultValue={query.q} name="q" id="catalogue-q" type="search" placeholder="Search gifts or brands"/>
      <button type="submit">Search</button>
    </form>
    <div className="browse-toolbar__actions">
      <button type="button" className="browse-filter-trigger" onClick={onFilters}>
        Filters{activeCount?` (${activeCount})`:''}
      </button>
    </div>
  </div>;
}
