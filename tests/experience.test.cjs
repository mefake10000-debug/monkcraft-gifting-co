/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner with an isolated TypeScript require hook. */
const {test,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('typescript'); const fs=require('node:fs');const path=require('node:path');const Module=require('node:module');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(id,...args){return resolve.call(this,id.startsWith('@/')?path.join(process.cwd(),'src',id.slice(2)):id,...args)};
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,file);
const query=require('../src/data/catalogue/query.ts');
const {emptyCatalogueQuery}=require('../src/data/catalogue/queryParams.ts');
const {getAllProducts}=require('../src/data/catalogue/products.ts');
beforeEach(()=>{const memory=new Map();const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};global.window={localStorage:storage,sessionStorage:storage,dispatchEvent:()=>{}};global.CustomEvent=class{constructor(type){this.type=type}};});
test('facet counts respect other groups but exclude their own selection',()=>{
 assert.equal(typeof query.getContextualFacets,'function');
 const products=getAllProducts();const q={...emptyCatalogueQuery(),categories:['drinkware-barware'],budgetMaxInr:500};
 const result=query.getContextualFacets(q);const expected=query.filterProducts(products,{...q,categories:[]}).filter(p=>p.filterCategorySlug==='apparel-lifestyle').length;
 assert.equal(result.categories.find(f=>f.id==='apparel-lifestyle')?.count,expected);
 assert.equal(result.total,query.filterProducts(products,q).length);
});
test('brand filter round trips and keeps only selected brand products',()=>{
 const params=require('../src/data/catalogue/queryParams.ts');
 const query={...emptyCatalogueQuery(),brands:['portronics']};
 const href=params.buildCatalogueHref(query);
 assert.match(href,/brand=portronics/);
 assert.deepEqual(params.parseCatalogueQuery({brand:'portronics'}).brands,['portronics']);
 const result=require('../src/data/catalogue/query.ts').filterProducts(getAllProducts(),query);
 assert.ok(result.length>0);
 assert.ok(result.every(p=>p.brandName?.toLowerCase()==='portronics'));
});
test('selected zero-result facets remain removable',()=>{assert.equal(typeof query.getContextualFacets,'function');const result=query.getContextualFacets({...emptyCatalogueQuery(),q:'__no_product__',colours:['audit-unknown']});assert.equal(result.colours.find(f=>f.id==='audit-unknown')?.count,0)});
test('Greys & Blues jerseys with distinct artwork stay design options, not color variants',()=>{
 const jersey=getAllProducts().find(p=>p.id==='MGC-2886');
 assert.ok(jersey);
 assert.deepEqual(query.getColourVariants(jersey),[]);
 const approvedColorFamily=getAllProducts().find(p=>p.id==='MGC-2868');
 assert.ok(query.getColourVariants(approvedColorFamily).length>1);
});
test('explicitly approved colour families expose only their linked product records',()=>{
 const products=getAllProducts();
 const colors=require('../src/data/catalogue/colourFamilies.json');
 assert.ok(Array.isArray(colors));
 assert.equal(colors.length,450);
 const {resolveColourFamily}=require('../src/data/catalogue/colourVariants.ts');
 const first=products.find(p=>p.name==='Greys&Blues Round Neck Sports Jersey- Full Sleeve');
 const second=products.find(p=>p.name===first.name&&p.colours[0]!==first.colours[0]);
 const family=resolveColourFamily(first,products,[{familyId:'test-family',productIds:[first.id,second.id],reviewed:true,imageReviewed:true}]);
 assert.equal(family.length,2);
 assert.ok(family.some(p=>p.id===first.id));
 assert.ok(family.some(p=>p.id===second.id));
 const {countAvailableColours}=require('../src/data/catalogue/colourVariants.ts');
 assert.equal(countAvailableColours([{availabilityStatus:'IN_STOCK'},{availabilityStatus:'IN_STOCK'},{availabilityStatus:'OUT'},{availabilityStatus:undefined}]),2);
});
test('product minimum quantities use the verified source MOQ only',()=>{
 const {standardProductQuantityFloor}=require('../src/lib/shortlist.ts');
 assert.equal(standardProductQuantityFloor(3),3);
 assert.equal(standardProductQuantityFloor(50),50);
 assert.equal(standardProductQuantityFloor(undefined),1);
 const products=getAllProducts();
 assert.ok(products.length>0);
 const source=require('../src/data/catalogue/export/products.json').products;
 const sourceById=new Map(source.map(product=>[product.sku,product]));
 assert.ok(products.every(product=>product.minQuantity===[sourceById.get(product.id)?.availability?.moq,sourceById.get(product.id)?.availability?.minimumOrderQuantity].find(minimum=>typeof minimum==='number'&&Number.isFinite(minimum)&&minimum>0)));
});
test('drinkware subcategories contain only drinkware and group coasters together',()=>{
 const {getSubcategoryFacets}=require('../src/data/catalogue/facets.ts');
 const facets=getSubcategoryFacets('drinkware-barware');
 assert.ok(facets.some(facet=>facet.id==='coasters'));
 for(const misplaced of ['stationery','self-care','upcycled','gift-sets','organisers'])
  assert.equal(facets.some(facet=>facet.id===misplaced),false,`${misplaced} should not appear under Drinkware`);
 assert.ok(getAllProducts().filter(product=>product.filterCategorySlug==='drinkware-barware'&&/\bcoaster\b/i.test(product.name)).every(product=>product.subcategorySlug==='coasters'));
});
test('featured drinkware browse keeps brands together inside its product subcategory',()=>{
 const result=query.queryCatalogue({...emptyCatalogueQuery(),categories:['drinkware-barware'],subcategories:['bottles']});
 const brandNames=result.products.map(product=>(product.brandName||'').trim().toLocaleLowerCase());
 assert.deepEqual(brandNames,[...brandNames].sort((a,b)=>a.localeCompare(b)));
});
test('buyer taxonomy separates bag families and keeps campus in backpacks',()=>{
 const products=getAllProducts();
 const byId=id=>products.find(product=>product.id===id);
 assert.equal(byId('MGC-1463')?.subcategorySlug,'backpacks');
 assert.equal(byId('MGC-1784')?.subcategorySlug,'handbags');
 assert.equal(byId('MGC-1943')?.subcategorySlug,'briefcases');
 assert.equal(byId('MGC-1746')?.subcategorySlug,'sports-bags');
 assert.equal(byId('MGC-1884')?.subcategorySlug,'pouches-organisers');
 assert.equal(byId('MGC-1330')?.subcategorySlug,'backpacks');
 assert.equal(byId('MGC-1581')?.subcategorySlug,'crossbody-bags');
 const facets=require('../src/data/catalogue/facets.ts').getSubcategoryFacets('bags-travel');
 assert.ok(facets.some(facet=>facet.id==='handbags'&&facet.label==='Handbags'));
 assert.ok(facets.some(facet=>facet.id==='briefcases'&&facet.label==='Briefcases & Messenger Bags'));
 assert.ok(facets.some(facet=>facet.id==='other-bags'&&facet.label==='Other Bags & Travel Gear'));
 assert.equal(facets.some(facet=>facet.id==='travel'),false);
 assert.ok(byId('MGC-2853'), 'previously filtered products remain in the full catalogue');
 assert.equal(products.find(product=>product.id==='MGC-2854')?.subcategorySlug,'sportswear');
});
test('plural audio product names map to Audio rather than Desk Tech',()=>{
 const products=getAllProducts();
 for(const id of ['MGC-1022','MGC-1216'])
  assert.equal(products.find(product=>product.id===id)?.subcategorySlug,'audio',id);
});
test('colour family resolution rejects unreviewed, duplicate, missing and colorless members',()=>{
 const products=getAllProducts();
 const {resolveColourFamily}=require('../src/data/catalogue/colourVariants.ts');
 const first=products.find(p=>p.name==='Greys&Blues Round Neck Sports Jersey- Full Sleeve');
 const second=products.find(p=>p.name===first.name&&p.colours[0]!==first.colours[0]);
 const base={familyId:'test-family',productIds:[first.id,second.id],reviewed:true,imageReviewed:true};
 assert.deepEqual(resolveColourFamily(first,products,[{...base,reviewed:false}]),[]);
 assert.deepEqual(resolveColourFamily(first,products,[{...base,imageReviewed:false}]),[]);
 assert.deepEqual(resolveColourFamily(first,products,[{...base,productIds:[first.id,first.id]}]),[]);
 assert.deepEqual(resolveColourFamily(first,products,[{...base,productIds:[first.id,'missing-id']}]),[]);
 const colorless={...second,colours:[]};
 assert.deepEqual(resolveColourFamily(first,[...products.filter(p=>p.id!==second.id),colorless],[base]),[]);
 const mismatched={...second,name:'Different product'};
 assert.deepEqual(resolveColourFamily(first,[...products.filter(p=>p.id!==second.id),mismatched],[base]),[]);
});
test('reviewed Visionbook colours are grouped while distinct same-colour jersey designs stay separate',()=>{
 const products=getAllProducts();
 const families=require('../src/data/catalogue/colourFamilies.json');
 const {resolveColourFamily}=require('../src/data/catalogue/colourVariants.ts');
 const green=products.find(p=>p.id==='MGC-3989');
 assert.deepEqual(resolveColourFamily(green,products,families).map(p=>p.id),['MGC-3989','MGC-3990']);
 assert.equal(green.colourFamilyCode,'MGC-FAM-035');
 const fullSleeveBlack=products.find(p=>p.id==='MGC-2886');
 const halfSleeveBlack=products.find(p=>p.id==='MGC-2868');
 assert.equal(resolveColourFamily(fullSleeveBlack,products,families).length,0);
 assert.equal(resolveColourFamily(halfSleeveBlack,products,families).length,19);
 assert.notEqual(fullSleeveBlack.colourFamilyCode,halfSleeveBlack.colourFamilyCode);
});
test('catalogue cards expose one family representative with the complete colour count',()=>{
 const result=query.queryCatalogue({...emptyCatalogueQuery(),q:'Venice Metal Pen'});
 assert.equal(result.total,1);
 assert.equal(result.products[0].colourVariantCount,4);
 assert.equal(result.products[0].colourFamilyCode,'MGC-FAM-001');
 assert.deepEqual(result.products[0].colourVariantOptions.map(option=>option.colours[0]),['Black','Blue','Red','White']);
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 assert.match(card,/colourVariants=\{product\.colourVariantOptions/);
});
test('catalogue colour filters keep card swatches inside the active colour selection',()=>{
 const product=getAllProducts().find(item=>item.id==='MGC-2566');
 assert.ok(product?.colourIds.length);
 const result=query.queryCatalogue({...emptyCatalogueQuery(),brands:['scott'],colours:product.colourIds});
 const card=result.products.find(item=>item.colourVariantOptions?.some(option=>option.id===product.id));
 assert.ok(card);
 assert.deepEqual(card.colourVariantOptions.map(option=>option.id),[product.id]);
});
test('product cards reset a previously selected variant when a filter removes it',()=>{
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 assert.match(card,/eligibleVariantSignature/);
 assert.match(card,/allowedVariantIds\.has\(selectedCardProduct\.id\)/);
 assert.match(card,/const activeCardProduct = allowedVariantIds\.has\(selectedCardProduct\.id\)[\s\S]*?\? selectedCardProduct[\s\S]*?: product/);
});
test('reviewed colour families include the confirmed missing Scott and American Tourister options',()=>{
 const products=getAllProducts();
 const ids=productId=>query.getColourVariants(products.find(product=>product.id===productId)).map(product=>product.id);
 assert.equal(ids('MGC-2566').length,11,'all AWG Solid Polo colour records stay together');
 assert.deepEqual(ids('MGC-2618'),['MGC-2619','MGC-2620','MGC-2618']);
 assert.deepEqual(ids('MGC-1286'),['MGC-1284','MGC-1285','MGC-1286']);
 assert.equal(products.find(product=>product.id==='MGC-1286').colourOptionLabel,'Grey with Black');
});
test('Adidas tipping polos and Allen Solly women’s polos show as reviewed colour families',()=>{
 const result=require('../src/data/catalogue/query.ts').queryCatalogue;
 const adidas=result({...emptyCatalogueQuery(),q:'Adidas 100% Cotton Tipping Polo T-Shirt'});
 assert.equal(adidas.total,1);
 assert.equal(adidas.products[0].colourVariantCount,6);
 assert.deepEqual(adidas.products[0].colourVariantOptions.map(option=>option.colours[0]),['Green','Grey','Navy Blue','Red','Royal Blue','White']);
 assert.ok(adidas.products[0].colourVariantOptions.every(option=>option.colourFamilyCode==='MGC-FAM-060'));
 const allen=result({...emptyCatalogueQuery(),q:'Allen Solly Polo T-shirt Women'});
 assert.equal(allen.total,1);
 assert.equal(allen.products[0].colourVariantCount,8);
 assert.ok(allen.products[0].colourVariantOptions.every(option=>option.images.length));
 const clima=result({...emptyCatalogueQuery(),q:'Adidas Clima Lite Tshirt'});
 assert.equal(clima.total,1);
 assert.equal(clima.products[0].colourVariantCount,6);
});
test('Polos & Tees candidates with matching source facts and reviewed images are grouped',()=>{
 const products=getAllProducts();
 const families=require('../src/data/catalogue/colourFamilies.json');
 const {resolveColourFamily}=require('../src/data/catalogue/colourVariants.ts');
 const expanded=families.filter(family=>Number(family.familyCode.slice(-3))>=62&&Number(family.familyCode.slice(-3))<=158);
 assert.equal(expanded.length,96);
 assert.ok(expanded.every(family=>family.reviewed&&family.imageReviewed));
 const activeIds=new Set(products.map(product=>product.id));
 const activeFamilies=expanded.filter(family=>family.productIds.every(id=>activeIds.has(id)));
 assert.ok(activeFamilies.every(family=>resolveColourFamily(products.find(product=>product.id===family.productIds[0]),products,[family]).length===family.productIds.length));
 const men=require('../src/data/catalogue/query.ts').queryCatalogue({...emptyCatalogueQuery(),q:'Allen Solly Polo T-shirt Men'});
 assert.equal(men.total,1);
 assert.equal(men.products[0].colourVariantCount,8);
 assert.equal(men.products[0].colourFamilyCode,'MGC-FAM-064');
});
test('family selection switches in place with accessible colour swatches and a single tracking label',()=>{
 const detail=fs.readFileSync(path.join(process.cwd(),'src/app/gifts/[slug]/page.tsx'),'utf8');
 const gallery=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductGallery.tsx'),'utf8');
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 assert.match(detail,/ProductVariantExperience/);
 assert.match(detail,/getRelatedProducts\(product, 8\)\.filter\(\(item\) => !variantIds\.has\(item\.id\)\)/);
 assert.match(gallery,/onSelectVariant/);
 assert.match(gallery,/aria-pressed/);
 assert.match(gallery,/colour-swatch/);
 assert.doesNotMatch(gallery,/product-image-viewer|zoomOpen|Tap to view full size/);
 assert.doesNotMatch(gallery,/href=\{`\/gifts\/\$\{variant\.slug\}`\}/);
 assert.match(card,/colourVariantOptions.*length/);
 assert.doesNotMatch(card,/View all colour options/);
 assert.match(card,/\$\{product\.colourVariantCount\} colours/);
 assert.doesNotMatch(card,/href=\{`\/gifts\/\$\{variant\.slug\}`\}/);
});
test('catalogue cards keep colour selection in place and show the family count at top right',()=>{
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 const css=fs.readFileSync(path.join(process.cwd(),'src/app/gifts/catalogue-v2.css'),'utf8');
 assert.match(card,/selectedCardProduct/);
 assert.match(card,/colourSwatchStyle/);
 assert.match(card,/product-card__colour-picker/);
 assert.match(css,/\.product-card__family-badge\s*\{[^}]*z-index:\s*10/s);
 assert.match(css,/\.product-card__family-badge\s*\{[^}]*background:\s*(?:var\(--mc-royal-purple\)|#662f90)/is);
 assert.doesNotMatch(card,/Full product page/);
});
test('colour swatches understand compound and slash-separated verified colour labels',()=>{
 const {colourSwatchStyle}=require('../src/data/catalogue/colourSwatches.ts');
 assert.equal(colourSwatchStyle('Navy Blue').backgroundColor,'#263758');
 assert.equal(colourSwatchStyle('Red / White').backgroundImage,'linear-gradient(135deg, #c63d4b 0 50%, #fbfaf7 50% 100%)');
 const source=require('../src/data/catalogue/export/products.json').products;
 const labels=[...new Set(source.map(product=>product.specifications?.Color?.trim()).filter(Boolean))];
 assert.ok(labels.every(label=>{const style=colourSwatchStyle(label);return style.backgroundColor!=='#b7b7b7'||Boolean(style.backgroundImage);}));
});
test('product-facing minimum quantities use the source MOQ and identify missing values',()=>{
 const {standardProductQuantityFloor,productMinimumOrderLabel}=require('../src/lib/shortlist.ts');
 assert.equal(standardProductQuantityFloor(12),12);
 assert.equal(standardProductQuantityFloor(undefined),1);
 assert.equal(productMinimumOrderLabel(12),'12 pcs');
 assert.equal(productMinimumOrderLabel(undefined),'Confirm in quote');
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 const detail=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductVariantExperience.tsx'),'utf8');
 const compare=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/CompareView.tsx'),'utf8');
 const box=fs.readFileSync(path.join(process.cwd(),'src/components/box/BoxBuilder.tsx'),'utf8');
 const studio=fs.readFileSync(path.join(process.cwd(),'src/components/studio/CatalogueBuilder.tsx'),'utf8');
 assert.match(card,/productMinimumOrderLabel/);
 assert.match(detail,/productMinimumOrderLabel/);
 assert.match(compare,/productMinimumOrderLabel/);
 assert.match(box,/box-catalogue-picker/);
 assert.match(box,/Add to kit/);
 assert.match(studio,/productMinimumOrderLabel/);
});
test('sourced dispatch details remain available as product specifications',()=>{
 const products=getAllProducts();
 assert.ok(products.some(product=>product.attributes.some(attribute=>attribute.label.toLowerCase()==='dispatch timeline')));
});
test('customization method remains available under Branding options and in specifications',()=>{
 const products=getAllProducts();
 const product=products.find(item=>item.customization);
 assert.ok(product);
 assert.ok(product.customization);
 assert.ok(product.brandingOptions.includes(product.customization.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')));
 assert.ok(products.some(item=>item.attributes.some(attribute=>attribute.label.toLowerCase()==='customization type')));
 const compare=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/CompareView.tsx'),'utf8');
 assert.match(compare,/product\.customization\s*\|\|\s*"—"/);
});
test('quick view returns keyboard focus to the exact control that opened it',()=>{
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 assert.match(card,/className="product-card__detail" onClick=\{\(event\) => \{ openerRef\.current = event\.currentTarget;/);
});
test('catalogue query changes use browser history rather than replacing the current entry',()=>{
 const shell=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/CatalogueShell.tsx'),'utf8');
 assert.match(shell,/router\.push\(href,\{scroll:false\}\)/);
 assert.doesNotMatch(shell,/router\.replace\(href/);
 assert.match(shell,/const pop=\(\)=>\{pendingHref\.current=null;pendingScroll\.current=true;\}/);
 assert.match(shell,/\},\[props\.query,props\.page,basePath\]\);/);
});
test('Build a Box uses a single column until its summary sidebar is visible',()=>{
 const css=fs.readFileSync(path.join(process.cwd(),'src/app/gifts/catalogue-v2.css'),'utf8');
 assert.match(css,/@media \(min-width: 1200px\)\s*\{\s*\.box-builder__layout\s*\{\s*grid-template-columns:/s);
 assert.doesNotMatch(css,/@media \(min-width: 960px\)\s*\{\s*\.box-builder__layout\s*\{\s*grid-template-columns:/s);
});
test('category selector exposes subcategories only for the selected category and preserves URL query support',()=>{
 const toolbar=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/CatalogueToolbar.tsx'),'utf8');
 assert.match(toolbar,/getSubcategoryFacets|subcategoryFacets/);
 assert.match(toolbar,/categories/);
 assert.match(toolbar,/subcategories/);
 assert.match(toolbar,/onChange/);
 assert.match(toolbar,/Browse by category/);
 assert.match(toolbar,/subcategoryFacetsByCategory/);
 const {getSubcategoryFacets}=require('../src/data/catalogue/facets.ts');
 const apparel=getSubcategoryFacets('apparel-lifestyle');
 assert.ok(apparel.length>0);
 assert.ok(apparel.some(facet=>facet.label==='Accessories'));
 assert.ok(apparel.some(facet=>facet.label==='Polos & Tees'));
 assert.ok(getSubcategoryFacets('office-stationery').some(facet=>facet.label==='Notebooks & Planners'));
});
test('canonical SKU is not duplicated in mapped product specifications',()=>{
 const product=getAllProducts().find(p=>p.sku);
 assert.ok(product);
 assert.equal(product.attributes.some(a=>['sku','product code'].includes(a.label.toLowerCase())&&a.value===product.sku),false);
 assert.equal(product.id,product.sku);
});
test('catalogue records keep every source product, description and image reference',()=>{
 const products=getAllProducts();
 const source=require('../src/data/catalogue/export/products.json').products;
 const reviewedDescriptions=new Map(require('../src/data/catalogue/editorial/product-descriptions.json').filter(entry=>entry.reviewed===true).map(entry=>[entry.productId,entry.description]));
 assert.equal(products.length,source.length);
 for(const sourceProduct of source){
  const product=products.find(item=>item.id===sourceProduct.sku);
  assert.ok(product,'source product '+sourceProduct.sku+' remains in the catalogue');
  assert.equal(product.name,sourceProduct.title);
  assert.equal(product.summary,reviewedDescriptions.get(sourceProduct.sku)||(sourceProduct.shortDescription||sourceProduct.description||'').trim()||sourceProduct.title);
  assert.equal(product.description,sourceProduct.description?.trim()||undefined);
  const expectedImages=(sourceProduct.images||[]).map(image=>({
   src:image.path.startsWith('media/')?'/catalogue-media/'+image.path.slice(6):image.path.startsWith('/')?image.path:'/catalogue-media/'+(image.path.startsWith('./')?image.path.slice(2):image.path),
  }));
  const recoveredImagePaths=new Set(require('../src/data/catalogue/productImageOverrides.json')
   .filter(override=>override.productId===sourceProduct.sku).map(override=>override.path));
  const sourceImages=product.images.filter(image=>!recoveredImagePaths.has(image.src));
  assert.deepEqual(sourceImages.map(image=>image.src),expectedImages.map(image=>image.src));
 }
});
test('missing-photo products rank after photographed products in their category',()=>{
 const base=getAllProducts().find(p=>p.images.length);
 assert.ok(base);
 const missing={...base,id:'missing',name:'A missing image',images:[]};
 const pictured={...base,id:'pictured',name:'Z pictured product'};
 assert.deepEqual(query.sortProducts([missing,pictured],'featured',{...emptyCatalogueQuery(),categories:[base.filterCategorySlug]}).map(p=>p.id),['pictured','missing']);
});
test('catalogue page changes focus the first product result and expose missing photos accessibly',()=>{
 const shell=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/CatalogueShell.tsx'),'utf8');
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 assert.match(shell,/firstResultRef|focusFirstCatalogueResult/);
 assert.match(shell,/data-product-id=\{product\.id\} tabIndex=\{index===0\?-1:undefined\} ref=\{index===0\?firstResultRef:undefined\}/);
 assert.match(card,/Photo unavailable/);
 assert.doesNotMatch(card,/product-card__media-empty" aria-hidden="true"/);
});
test('Gift Finder treats explicit negative product preferences as exclusions',()=>{
 const finder=require('../src/lib/giftFinder/recommend.ts');
 const response=finder.recommendGifts({requirements:{...require('../src/lib/giftFinder/types.ts').emptyGiftFinderRequirements(),freeText:'no apparel'}});
 const shown=[...response.matches,...response.alternatives];
 assert.ok(shown.length>0);
 assert.ok(shown.every(item=>item.product.categorySlug!=='apparel-lifestyle'));
});
test('a cleared linked catalogue is removed before quotation preparation',async()=>{
 const brief=require('../src/lib/brief.ts');brief.patchBrief({sources:{studioCatalogue:{title:'Old catalogue',companyName:'Test',productIds:[],productSummaries:[],linkedAt:'',pricingMode:'hidden',logo:null}}});
 const workspace=require('../src/lib/briefWorkspace.ts');await workspace.refreshBriefLinksFromLiveDrafts();assert.equal(brief.readBrief().sources.studioCatalogue,null);
});
test('box updates propagate owned fields while preserving manual brief edits',()=>{
 const box=require('../src/lib/box.ts'); const brief=require('../src/lib/brief.ts');let draft=box.readBoxDraft(); draft.customization.occasion='Onboarding';draft.customization.budgetPerBox='1000';box.syncBoxDraftToBrief(draft);draft.customization.occasion='Diwali';draft.customization.budgetPerBox='2000';box.syncBoxDraftToBrief(draft);assert.equal(brief.readBrief().occasion,'Diwali');brief.patchBrief({occasion:'Manual occasion',fieldMode:'replace'});draft.customization.occasion='Christmas';box.syncBoxDraftToBrief(draft);assert.equal(brief.readBrief().occasion,'Manual occasion');
});
test('shortlist retains structured numeric price for box handoff',()=>{
 const shortlist=require('../src/lib/shortlist.ts');shortlist.addToShortlist({id:'test',slug:'test',name:'Test',priceLabel:'₹100',amountInr:100});assert.equal(shortlist.readShortlist()[0].amountInr,100);
});
test('favourites are saved independently from quote-list selections',()=>{
 const favourites=require('../src/lib/favourites.ts');
 favourites.toggleFavourite('gift-a');
 assert.equal(favourites.isFavourite('gift-a'),true);
 assert.equal(require('../src/lib/shortlist.ts').isShortlisted('gift-a'),false);
 favourites.toggleFavourite('gift-a');
 assert.equal(favourites.isFavourite('gift-a'),false);
});
test('homepage services section keeps the brand film alongside its service choices',()=>{
 const section=fs.readFileSync(path.join(process.cwd(),'src/components/WhatWeDo.tsx'),'utf8');
 assert.match(section,/BrandVideoBand/);
 assert.match(section,/monkcraft-what-we-do-mobile\.mp4/);
 assert.match(section,/monkcraft-what-we-do-desktop\.mp4/);
 assert.match(section,/Catalogue & gift boxes/);
 assert.match(section,/Build a gift box/);
});
test('header gives catalog search a compact, accessible search icon',()=>{
 const header=fs.readFileSync(path.join(process.cwd(),'src/components/SiteHeader.tsx'),'utf8');
 assert.match(header,/site-header__search/);
 assert.match(header,/aria-label="Search catalogue"/);
 assert.match(header,/<svg/);
 assert.match(header,/site-header__brief-link/);
 assert.match(header,/My Brief/);
 assert.match(header,/Open My Gifting Brief/);
 assert.match(header,/Open quote selections/);
});
test('saved-gift star sits in the product action row, outside product imagery',()=>{
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 const actions=card.indexOf('className="product-card__actions"');
 const favourite=card.indexOf('<FavouriteButton');
 assert.ok(actions>=0&&favourite>actions);
});
test('catalogue quote actions name saved items and keep Build a Box as a separate tool',()=>{
 const button=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ShortlistButton.tsx'),'utf8');
 const intro=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/CatalogueIntro.tsx'),'utf8');
 assert.match(button,/Add to quote/);
 assert.match(button,/In quote/);
 assert.doesNotMatch(button,/to cart|In cart/i);
 assert.match(intro,/Prices are indicative/);
 assert.match(intro,/Build a Box/);
 assert.match(intro,/Bulk pricing and availability are confirmed with your quote/);
 assert.match(intro,/BOX_CATALOGUE_HREF/);
});
test('box-context catalogue cards can add a selected product without opening details',()=>{
 const shell=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/CatalogueShell.tsx'),'utf8');
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 assert.match(shell,/<ProductCard[^>]*fromBox=\{props\.fromBox\}/);
 assert.match(card,/fromBox\?: boolean/);
 assert.match(card,/fromBox\s*\?\s*\(\s*<AddToBoxButton snapshot=\{boxSnapshot\} variant="card"\s*\/>\s*\)\s*:\s*\(\s*<ShortlistButton/);
});
test('catalogue quote selection uses brief language rather than cart terminology',()=>{
 const button=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ShortlistButton.tsx'),'utf8');
 const intro=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/CatalogueIntro.tsx'),'utf8');
 assert.match(button,/Add \$\{snapshot\.name\} to quote selections/);
 assert.match(button,/In quote/);
 assert.doesNotMatch(button,/to cart|In cart/i);
 assert.match(intro,/BOX_CATALOGUE_HREF/);
});
test('standard product quote lines use source MOQ values when available',()=>{
 const shortlist=require('../src/lib/shortlist.ts');
 shortlist.addToShortlist({id:'standard-25',slug:'standard-25',name:'Standard',priceLabel:'Quote'});
 shortlist.addToShortlist({id:'supplier-50',slug:'supplier-50',name:'Supplier minimum',priceLabel:'Quote',minQuantity:50});
 assert.equal(shortlist.readShortlist().find(item=>item.id==='standard-25').quantity,1);
 assert.equal(shortlist.readShortlist().find(item=>item.id==='supplier-50').quantity,50);
});
test('product-only quote can be prepared without a box or a specified occasion',()=>{
 const brief=require('../src/lib/brief.ts');
 const list=require('../src/lib/shortlist.ts');
 list.addToShortlist({id:'standard-25',slug:'standard-25',name:'Standard',priceLabel:'Quote'});
 const missing=brief.getBriefMissingDetails(brief.readBrief(),list.readShortlist());
 assert.equal(missing.some(item=>item.id==='occasion'&&item.severity==='required'),false);
 assert.equal(missing.some(item=>item.id==='products'&&item.severity==='required'),false);
});
test('WhatsApp quote contact does not require a work email',()=>{
 const {validateEnquiryContact}=require('../src/lib/enquiryValidation.ts');
 assert.deepEqual(validateEnquiryContact({name:'Buyer',company:'Acme',phone:'9876543210'}),{});
 assert.ok(validateEnquiryContact({name:'Buyer',company:'Acme'}).phone);
});
test('public Monkcraft contact defaults use the supplied inbox and WhatsApp number',()=>{
 const channels=require('../src/lib/contactConfig.ts').getContactChannels();
 assert.equal(channels.enquiryEmail,'info@monkcraft.in');
 assert.equal(channels.whatsappE164,'917483221188');
 assert.equal(channels.hasLiveChannel,true);
});
test('quote dispatch choice is saved and included in the prepared summary',()=>{
 const brief=require('../src/lib/brief.ts');
 brief.patchBrief({dispatchType:'multi-point',fieldMode:'replace'});
 assert.equal(brief.readBrief().dispatchType,'multi-point');
 assert.match(brief.buildQuotationPrepText({brief:brief.readBrief(),products:[]}),/Dispatch plan: Multiple delivery points/);
});
test('WhatsApp preview discloses product omissions and long-message truncation',()=>{
 const brief=require('../src/lib/brief.ts');const current=brief.readBrief();
 const products=Array.from({length:10},(_,index)=>({id:`p${index}`,slug:`p${index}`,name:`Gift ${index}`,priceLabel:'Quote',quantity:25}));
 const text=brief.buildBriefWhatsAppMessage({...current,notes:'A'.repeat(1500)},products,{company:'Acme'});
 assert.ok(text.length<=1200);
 assert.match(text,/more are in the complete quote summary/);
 assert.match(text,/Shortened for WhatsApp/);
});
test('catalogue return context accepts only same-site catalogue URLs',()=>{
 let browsing;try{browsing=require('../src/lib/catalogueBrowsing.ts')}catch{}assert.equal(typeof browsing?.safeCatalogueHref,'function');assert.equal(browsing.safeCatalogueHref('/gifts?category=bags-travel&page=2'),'/gifts?category=bags-travel&page=2');assert.equal(browsing.safeCatalogueHref('//evil.example/gifts'),'/gifts');assert.equal(browsing.safeCatalogueHref('/gifts/brief'),'/gifts');
});
test('removing Box content clears linked requirements but preserves manual requirements',async()=>{
 const box=require('../src/lib/box.ts');const brief=require('../src/lib/brief.ts');const workspace=require('../src/lib/briefWorkspace.ts');const draft=box.readBoxDraft();draft.customization.occasion='Onboarding';draft.customization.budgetPerBox='1000';box.syncBoxDraftToBrief(draft);await workspace.refreshBriefLinksFromLiveDrafts();assert.equal(brief.readBrief().occasion,'');assert.equal(brief.readBrief().budgetPerRecipient,'');
});
test('budget range accepts both bounds together and rejects inverted ranges',()=>{
 const params=require('../src/data/catalogue/queryParams.ts');assert.equal(typeof params.parseBudgetRange,'function');assert.deepEqual(params.parseBudgetRange('500','2000'),{valid:true,min:500,max:2000});assert.equal(params.parseBudgetRange('2000','500').valid,false);assert.equal(params.parseBudgetRange('-1','500').valid,false);assert.equal(params.parseBudgetRange('1.5','500').valid,false);assert.deepEqual(params.parseBudgetRange('',''),{valid:true,min:null,max:null});
});
test('browsing state keeps filter expansion and anchor per exact catalogue URL',()=>{
 global.sessionStorage=window.sessionStorage;const browsing=require('../src/lib/catalogueBrowsing.ts');browsing.saveCatalogueBrowse('/gifts?page=2',{scrollY:650,anchorId:'gift-1',anchorOffset:150,groups:{budget:false,categories:true}});assert.equal(browsing.catalogueReturnHref(),'/gifts?page=2');assert.equal(browsing.readCatalogueBrowse('/gifts?page=2').anchorOffset,150);assert.equal(browsing.readCatalogueBrowse('/gifts'),null);assert.equal(browsing.readCatalogueBrowse('/gifts?page=2').groups.budget,false);
});
test('returning from Box preserves catalogue context and box mode',()=>{
 const browsing=require('../src/lib/catalogueBrowsing.ts');
 browsing.saveCatalogueBrowse('/gifts?category=bags-travel&page=3',{scrollY:420,groups:{categories:true}});
 assert.equal(browsing.catalogueReturnHref({fromBox:true}),'/gifts?category=bags-travel&page=3&from=box');
 assert.equal(browsing.catalogueReturnHref(),'/gifts?category=bags-travel&page=3');
});
test('Build a Box has one review-and-quote step after packaging and migrates saved reviews',()=>{
 const {BOX_STEPS}=require('../src/data/catalogue/boxTypes.ts');
 assert.deepEqual(BOX_STEPS,['products','packaging','quote']);
 const saved={step:'review',products:[{id:'saved',slug:'saved',name:'Saved gift',priceLabel:'Quote on request',quantityPerBox:1}],packaging:{kind:'pending',note:'Recommend'},customization:{numberOfBoxes:25},contact:{name:'A'},updatedAt:'yesterday'};
 window.localStorage.setItem('monkcraft-box-v1',JSON.stringify(saved));
 const draft=require('../src/lib/box.ts').readBoxDraft();
 assert.equal(draft.step,'quote');
 assert.equal(draft.products[0].id,'saved');
 assert.equal(draft.packaging.kind,'pending');
 assert.equal(draft.contact.name,'A');
});
test('Build a Box unlocks the combined review and request after packaging is chosen',()=>{
 const box=require('../src/lib/box.ts');
 const draft=box.readBoxDraft();
 draft.products=[{id:'p1',slug:'p1',name:'Gift',priceLabel:'Quote on request',quantityPerBox:1}];
 draft.customization.companyName='';draft.customization.occasion='';draft.customization.numberOfBoxes=25;
 assert.equal(box.canEnterStep(draft,'packaging'),true);
 assert.equal(box.canEnterStep(draft,'quote'),false);
 draft.packaging={kind:'pending',note:'Recommend'};
 assert.equal(box.canEnterStep(draft,'quote'),true);
});
test('Build a Box uses each product source MOQ across the programme',()=>{
 const box=require('../src/lib/box.ts');
 const snapshot={id:'min-test',slug:'min-test',name:'Gift',priceLabel:'Quote on request'};
 const draft=box.addToBox(snapshot);
 assert.equal(draft.customization.numberOfBoxes,25);
 assert.equal(draft.products[0].quantityPerBox,1);
 assert.equal(box.programmeUnitTotal(1,25),25);
 assert.equal(box.boxSupplierMinimumShortfalls(draft).length,0);
 draft.products[0].minQuantity=50;
 assert.equal(box.boxSupplierMinimumShortfalls(draft).length,1);
 box.setBoxProductQuantity('min-test',1);
 assert.equal(box.readBoxDraft().products[0].quantityPerBox,1);
 box.updateBoxCustomization({numberOfBoxes:1});
 assert.equal(box.readBoxDraft().customization.numberOfBoxes,25);
});
test('Build a Box packaging choices use real catalogue photos and remain selected after reload',()=>{
 const packaging=require('../src/data/catalogue/packaging.ts');
 const box=require('../src/lib/box.ts');
 assert.ok(packaging.APPROVED_PACKAGING.length>0);
 for(const option of packaging.APPROVED_PACKAGING){
  assert.match(option.imageSrc,/^\/catalogue-media\/products\//);
 }
 const selected=packaging.APPROVED_PACKAGING[0];
 box.setBoxPackaging({kind:'selected',optionId:selected.id,name:selected.name,summary:selected.summary,imageSrc:selected.imageSrc,priceLabel:selected.priceLabel});
 assert.equal(box.readBoxDraft().packaging.optionId,selected.id);
});
test('Build a Box keeps packaging prices unquoted until the team confirms them',()=>{
 const box=require('../src/lib/box.ts');
 const draft=box.readBoxDraft();
 draft.products=[{id:'one',slug:'one',name:'One',priceLabel:'₹100',amountInr:100,quantityPerBox:1}];
 draft.customization.numberOfBoxes=25;
 draft.packaging={kind:'selected',optionId:'MGC-3296',name:'Gift box',summary:'Box'};
 const estimate=box.estimateBoxPricing(draft);
 assert.equal(estimate.packagingPerBoxInr,null);
 assert.equal(estimate.packagingTotalInr,null);
 assert.match(box.buildBoxQuotationPrepText(draft),/Packaging estimate: To be confirmed/);
});
test('Build a Box estimates packaging by product variety and includes dispatch in quote prep',()=>{
 const box=require('../src/lib/box.ts');
 const draft=box.readBoxDraft();
 draft.products=[{id:'1',slug:'one',name:'One',priceLabel:'₹100',amountInr:100,quantityPerBox:5},{id:'2',slug:'two',name:'Two',priceLabel:'₹100',amountInr:100,quantityPerBox:5}];
 draft.customization.numberOfBoxes=25;
 draft.packaging={kind:'selected',optionId:'MGC-3296',name:'Gift box',summary:'Box'};
 assert.equal(box.estimateBoxPricing(draft).packagingPerBoxInr,null);
 draft.products.push({id:'3',slug:'three',name:'Three',priceLabel:'₹100',amountInr:100,quantityPerBox:5},{id:'4',slug:'four',name:'Four',priceLabel:'₹100',amountInr:100,quantityPerBox:5});
 assert.equal(box.estimateBoxPricing(draft).packagingPerBoxInr,null);
 draft.products.push({id:'5',slug:'five',name:'Five',priceLabel:'₹100',amountInr:100,quantityPerBox:5},{id:'6',slug:'six',name:'Six',priceLabel:'₹100',amountInr:100,quantityPerBox:5});
 assert.equal(box.estimateBoxPricing(draft).packagingPerBoxInr,null);
 draft.packaging.optionId='tote-bag';
 assert.equal(box.estimateBoxPricing(draft).packagingPerBoxInr,null);
 draft.customization.dispatchType='multi-point';
 assert.match(box.buildBoxQuotationPrepText(draft),/Dispatch plan: Multiple delivery points/);
});
test('homepage brand scroll uses verified image marks and links to catalogue results',()=>{
 const {getHomepagePartnerBrands}=require('../src/data/partnerBrands.ts');
 const brands=getHomepagePartnerBrands();
 assert.ok(brands.length>1);
 assert.equal(brands[0].name,'Monkcraft');
 assert.equal(new Set(brands.map(brand=>brand.name)).size,brands.length);
 for(const brand of brands){
  assert.ok(brand.href,`${brand.name} is actionable`);
  assert.ok(brand.src,`${brand.name} has a verified logo`);
  assert.ok(fs.existsSync(path.join(process.cwd(),'public',brand.src.replace(/^\//,'')),`${brand.name} logo file exists`));
  if(brand.name==='Monkcraft') assert.equal(brand.href,'/gifts?brand=monkcraft');
  else assert.match(brand.href,/^\/gifts\?brand=/);
 }
});
test('catalogue navigation stays inactive on nested tools and active on product details',()=>{
 const {isNavActive}=require('../src/lib/nav.ts');
 for(const pathname of ['/gifts/find','/gifts/brief','/gifts/shortlist','/gifts/compare','/gifts/favourites'])
  assert.equal(isNavActive(pathname,'/gifts','gifts-root'),false,`${pathname} is a separate tool`);
 assert.equal(isNavActive('/gifts/example-product','/gifts','gifts-root'),true);
});
test('company stores landing has one responsive brief film and no repeated brand film',()=>{
 const page=fs.readFileSync(path.join(process.cwd(),'src/app/company-stores/page.tsx'),'utf8');
 assert.match(page,/company-store-brief/);
 assert.equal((page.match(/<BrandVideoBand/g)||[]).length,1);
 assert.doesNotMatch(page,/company-store-brand-film/);
 assert.doesNotMatch(page,/monkcraft-what-we-do-mobile\.mp4/);
 assert.match(page,/monkcraft-company-store-brief-mobile\.mp4/);
 assert.match(page,/monkcraft-company-store-brief-desktop\.mp4/);
});
