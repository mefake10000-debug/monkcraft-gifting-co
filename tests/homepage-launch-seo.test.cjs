/* eslint-disable @typescript-eslint/no-require-imports -- Node's built-in test runner uses CommonJS here. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (relative) => {
  const file = path.join(root, relative);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
};

test("homepage presents one accessible corporate-gifting heading with a restrained rotating phrase", () => {
  const page = read("src/app/page.tsx");
  const headline = read("src/components/RotatingHeroHeadline.tsx");
  const css = read("src/app/globals.css");

  assert.match(page, /<RotatingHeroHeadline\s*\/>/);
  assert.match(headline, /Corporate gifting for new starters, team milestones and client gifts\./);
  assert.match(headline, /new starters\./);
  assert.match(headline, /team milestones\./);
  assert.match(headline, /client gifts\./);
  assert.match(headline, /aria-hidden="true"/);
  assert.match(headline, /prefers-reduced-motion/);
  assert.match(css, /\.hero__rotator-word--active/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.hero__rotator-word/);
});

test("public service pages declare their canonical URL and utility pages stay out of search results", () => {
  const canonicalRoutes = [
    ["src/app/layout.tsx", "/"],
    ["src/app/gifts/page.tsx", "/gifts"],
    ["src/app/gifts/find/page.tsx", "/gifts/find"],
    ["src/app/gifts/box/page.tsx", "/gifts/box"],
    ["src/app/studio/page.tsx", "/studio"],
    ["src/app/company-stores/layout.tsx", "/company-stores"],
  ];

  for (const [file, route] of canonicalRoutes) {
    assert.match(read(file), new RegExp(`canonical:\\s*["']${route.replaceAll("/", "\\/")}?["']`), `${file} declares ${route} as canonical`);
  }

  for (const file of [
    "src/app/gifts/brief/page.tsx",
    "src/app/gifts/compare/page.tsx",
    "src/app/gifts/favourites/page.tsx",
    "src/app/gifts/shortlist/page.tsx",
    "src/app/company-stores/configure/layout.tsx",
    "src/app/company-stores/preview/layout.tsx",
    "src/app/ops/layout.tsx",
  ]) {
    assert.match(read(file), /index:\s*false[\s\S]*follow:\s*false|follow:\s*false[\s\S]*index:\s*false/, `${file} is non-indexable`);
    assert.match(read(file), /canonical:\s*null/, `${file} clears the inherited homepage canonical`);
  }

  const robots = read("src/app/robots.ts");
  assert.match(robots, /disallow:\s*\["\/api\/"\]/);
  assert.doesNotMatch(robots, /gifts\/(brief|compare|favourites|shortlist)/);

  const sitemap = read("src/app/sitemap.ts");
  assert.match(sitemap, /images:\s*product\.images\.map/);
  assert.doesNotMatch(sitemap, /gifts\/(brief|compare|favourites|shortlist)/);
});
