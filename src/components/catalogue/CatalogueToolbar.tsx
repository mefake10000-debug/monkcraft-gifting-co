'use client';
import type {CatalogueQuery} from '@/data/catalogue/types';
import type {CatalogueFacet} from '@/data/catalogue/types';
import {sortOptions} from '@/data/catalogue/queryParams';

export function CatalogueToolbar({query,onChange,onFilters,activeCount,categoryFacets,subcategoryFacetsByCategory}: {
  query:CatalogueQuery;
  onChange:(patch:Partial<CatalogueQuery>)=>void;
  onFilters:()=>void;
  activeCount:number;
  categoryFacets:CatalogueFacet[];
  subcategoryFacetsByCategory:Record<string,CatalogueFacet[]>;
}) {
  const selectedCategory=query.categories.length===1?query.categories[0]:'';
  const subcategories=selectedCategory?subcategoryFacetsByCategory[selectedCategory]??[]:[];
  return <div className="browse-toolbar">
    <form role="search" onSubmit={e=>{
      e.preventDefault();
      onChange({q:String(new FormData(e.currentTarget).get('q')||'').trim()});
    }}>
      <label className="visually-hidden" htmlFor="catalogue-q">Search the catalogue</label>
      <input key={query.q} defaultValue={query.q} name="q" id="catalogue-q" type="search" placeholder="Search gifts or brands"/>
      <button type="submit">Search</button>
    </form>
    <div className="browse-category-nav" aria-label="Browse by category">
      <label htmlFor="catalogue-category">Browse by category</label>
      <select id="catalogue-category" value={selectedCategory} onChange={event=>onChange({categories:event.target.value?[event.target.value]:[],subcategories:[]})}>
        <option value="">All categories</option>
        {categoryFacets.map(category=><option key={category.id} value={category.id}>{category.label}</option>)}
      </select>
      {selectedCategory&&<>
        <label className="visually-hidden" htmlFor="catalogue-subcategory">Subcategory</label>
        <select id="catalogue-subcategory" aria-label="Subcategory" value={query.subcategories.length===1?query.subcategories[0]:''} onChange={event=>onChange({subcategories:event.target.value?[event.target.value]:[]})}>
          <option value="">All subcategories</option>
          {subcategories.map(subcategory=><option key={subcategory.id} value={subcategory.id}>{subcategory.label}</option>)}
        </select>
      </>}
    </div>
    <div className="browse-toolbar__actions">
      <label className="browse-sort" htmlFor="catalogue-sort">
        Sort
        <select id="catalogue-sort" value={query.sort} onChange={event=>onChange({sort:event.target.value as CatalogueQuery['sort']})}>
          {sortOptions.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>
      <button type="button" className="browse-filter-trigger" onClick={onFilters}>
        Filters{activeCount?` (${activeCount})`:''}
      </button>
    </div>
  </div>;
}
