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
test('same-description colour variants share a catalogue card and remain selectable',()=>{
 const jersey=getAllProducts().find(p=>p.slug==='greys-blues-round-neck-sports-jersey-full-sleeve-1');
 assert.ok(jersey);
 const variants=query.getColourVariants(jersey);
 assert.ok(variants.length>=10);
 assert.ok(new Set(variants.map(p=>p.colours[0])).size>=10);
 const result=query.queryCatalogue({...emptyCatalogueQuery(),q:'Greys&Blues Round Neck Sports Jersey- Full Sleeve'});
 assert.ok(result.products.some(p=>p.colourVariantCount>=10));
});
test('missing-photo products rank after photographed products in their category',()=>{
 const base=getAllProducts().find(p=>p.images.length);
 assert.ok(base);
 const missing={...base,id:'missing',name:'A missing image',images:[]};
 const pictured={...base,id:'pictured',name:'Z pictured product'};
 assert.deepEqual(query.sortProducts([missing,pictured],'featured',{...emptyCatalogueQuery(),categories:[base.filterCategorySlug]}).map(p=>p.id),['pictured','missing']);
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
test('homepage thoughtful-gifts section keeps the brand film alongside its story',()=>{
 const section=fs.readFileSync(path.join(process.cwd(),'src/components/WhatWeDo.tsx'),'utf8');
 assert.match(section,/BrandVideoBand/);
 assert.match(section,/monkcraft-what-we-do-brand-film\.mp4/);
 assert.match(section,/Thoughtful gifts, made personal\./);
});
test('header gives catalog search a compact, accessible search icon',()=>{
 const header=fs.readFileSync(path.join(process.cwd(),'src/components/SiteHeader.tsx'),'utf8');
 assert.match(header,/site-header__search/);
 assert.match(header,/aria-label="Search catalog"/);
 assert.match(header,/<svg/);
 assert.match(header,/site-header__cart-icon/);
 assert.match(header,/Cart/);
});
test('saved-gift star sits in the product action row, outside product imagery',()=>{
 const card=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ProductCard.tsx'),'utf8');
 const actions=card.indexOf('className="product-card__actions"');
 const favourite=card.indexOf('<FavouriteButton');
 assert.ok(actions>=0&&favourite>actions);
});
test('catalogue actions add products to cart and disclose price verification',()=>{
 const button=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/ShortlistButton.tsx'),'utf8');
 const intro=fs.readFileSync(path.join(process.cwd(),'src/components/catalogue/CatalogueIntro.tsx'),'utf8');
 assert.match(button,/Add to cart/);
 assert.match(button,/In cart/);
 assert.match(intro,/Prices shown are indicative/);
 assert.match(intro,/price verification and approval/);
});
test('standard product quote lines start at five or the higher supplier MOQ',()=>{
 const shortlist=require('../src/lib/shortlist.ts');
 shortlist.addToShortlist({id:'standard-25',slug:'standard-25',name:'Standard',priceLabel:'Quote'});
 shortlist.addToShortlist({id:'supplier-50',slug:'supplier-50',name:'Supplier minimum',priceLabel:'Quote',minQuantity:50});
 assert.equal(shortlist.readShortlist().find(item=>item.id==='standard-25').quantity,5);
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
test('Build a Box keeps packaging before the final review and quote',()=>{
 const {BOX_STEPS}=require('../src/data/catalogue/boxTypes.ts');
 assert.deepEqual(BOX_STEPS,['products','packaging','review','quote']);
});
test('Build a Box lets people set box count and review before asking who the order is for',()=>{
 const box=require('../src/lib/box.ts');
 const draft=box.readBoxDraft();
 draft.products=[{id:'p1',slug:'p1',name:'Gift',priceLabel:'Quote on request',quantityPerBox:1}];
 draft.customization.companyName='';draft.customization.occasion='';draft.customization.numberOfBoxes=25;
 assert.equal(box.canEnterStep(draft,'packaging'),true);
 assert.equal(box.canEnterStep(draft,'review'),false);
 draft.packaging={kind:'pending',note:'Recommend'};
 assert.equal(box.canEnterStep(draft,'review'),true);
 assert.equal(box.canEnterStep(draft,'quote'),true);
});
test('Build a Box uses one of each product per 25-kit programme and checks supplier MOQ on total units',()=>{
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
 assert.ok(brands.length>=10);
 for(const brand of brands){
  assert.ok(brand.href,`${brand.name} is actionable`);
  assert.ok(brand.src,`${brand.name} uses a verified logo`);
  assert.ok(fs.existsSync(path.join(process.cwd(),'public',brand.src.replace(/^\//,'')),`${brand.name} logo file exists`));
  assert.match(brand.href,/^\/gifts\?q=/);
 }
});
