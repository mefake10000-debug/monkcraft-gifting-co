/* eslint-disable @typescript-eslint/no-require-imports -- Node's built-in test runner uses CommonJS here. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("homepage has a concise first screen and one clear discovery and enquiry path", () => {
  const page = read("src/app/page.tsx");
  assert.match(page, /<RotatingHeroHeadline\s*\/>/);
  assert.match(page, /Explore gifts/);
  assert.match(page, /Plan a gifting programme/);
  assert.doesNotMatch(page, /Build a Box/, "box building is no longer a separate hero destination");
  assert.match(page, /href="\/gifts"/);
  assert.match(page, /href="#enquire"/);
  assert.match(page, /<HeroLandingMedia\s*\/>/);
  assert.match(page, /<BrandLogoMarquee/);
});

test("homepage service choices group catalogue and box building without dropping original images", () => {
  const services = read("src/components/WhatWeDo.tsx");
  assert.match(services, /Catalogue & gift boxes/);
  assert.match(services, /Studio & branded merchandise/);
  assert.match(services, /Company Stores/);
  assert.match(services, /Explore the catalogue/);
  assert.match(services, /Build a gift box/);
  assert.doesNotMatch(services, /title: "Kits & Fulfilment"/);
  for (const asset of [
    "/marketing/what-we-do/corporate-gifting-v3.jpg",
    "/marketing/what-we-do/kits-fulfilment-v3.jpg",
    "/marketing/what-we-do/custom-merchandise-v3.jpg",
    "/marketing/what-we-do/company-stores-v3.jpg",
  ]) {
    assert.ok(services.includes(asset), `${asset} stays in the homepage`);
    assert.ok(fs.existsSync(path.join(root, "public", asset)));
  }
});

test("homepage enquiry accepts a brief without forcing free-text notes", () => {
  const form = read("src/components/Consultation.tsx");
  assert.match(form, /requireMessage:\s*false/);
  assert.match(form, /Anything else\? \(optional\)/);
  assert.doesNotMatch(form, /<textarea[\s\S]*?required/);
  assert.match(form, /<select[\s\S]*?enquiry-quantity/);
  assert.match(form, /<select[\s\S]*?enquiry-occasion/);
  assert.match(form, /products=\{/);
  assert.match(form, /source=\{/);
});

test("the shared header exposes the quote brief in desktop and mobile navigation", () => {
  const header = read("src/components/SiteHeader.tsx");
  const css = read("src/app/globals.css");
  assert.match(header, /className="site-header__cta site-header__brief-link"/);
  assert.match(header, /My Brief/);
  assert.match(header, /Quote selections/);
  assert.match(header, /className="clean-mobile-nav"[\s\S]*?My Gifting Brief/);
  assert.match(css, /\.site-header__brief-link\s*\{[\s\S]*?display:\s*inline-flex/);
  assert.match(css, /@media\s*\(max-width:\s*899px\)[\s\S]*?\.site-header__brief-link/);
});

test("Gift Finder stays available below the primary header, not in the top help controls", () => {
  const headerTools = read("src/components/HeaderTools.tsx");
  assert.doesNotMatch(headerTools, /href="\/gifts\/find"/);
  assert.match(read("src/components/SiteFooter.tsx"), /Gift Finder/);
});

test("homepage service heading matches the three visible service paths", () => {
  const services = read("src/components/WhatWeDo.tsx");
  assert.match(services, /One partner\. Three ways to gift\./);
  assert.doesNotMatch(services, /One partner\. Four ways to gift\./);
});

test("logo marquee runs without a visible pause control", () => {
  const marquee = read("src/components/BrandLogoMarquee.tsx");
  assert.doesNotMatch(marquee, /BrandMarqueeControls/);
  assert.doesNotMatch(marquee, /brand-marquee__controls/);
});

test("single-image service cards reserve height for their existing artwork", () => {
  const css = read("src/app/globals.css");
  const services = read("src/components/WhatWeDo.tsx");
  assert.match(css, /\.what-we-do__poster-frame:not\(\.what-we-do__poster-frame--pair\)\s+\.what-we-do__poster-image\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/);
  assert.match(services, /width=\{1920\}[\s\S]*?height=\{1071\}/);
  assert.doesNotMatch(services, /<Image[\s\S]*?fill/);
});

test("catalogue exposes supported sort choices as a labelled URL-backed control", () => {
  const toolbar = read("src/components/catalogue/CatalogueToolbar.tsx");
  assert.match(toolbar, /id="catalogue-sort"/);
  assert.match(toolbar, /sortOptions/);
  assert.match(toolbar, /onChange\(\{sort:/);
});
