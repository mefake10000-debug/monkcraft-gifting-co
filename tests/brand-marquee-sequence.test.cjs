/* eslint-disable @typescript-eslint/no-require-imports -- Node's built-in test runner uses CommonJS here. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
require("../scripts/register-ts-hook.cjs");

const { buildBrandMarqueeSequence } = require("../src/lib/brandMarqueeSequence.ts");

test("Monkcraft repeats after Swiss Military while the scrolling sequence stays continuous", () => {
  const monkcraft = { name: "Monkcraft", src: "/brands/monkcraft.png", href: "/gifts?brand=monkcraft" };
  const brands = [
    monkcraft,
    { name: "Adidas", src: "/brands/adidas.svg", href: "/gifts?brand=adidas" },
    { name: "Swiss Military", src: "/brands/swiss.svg", href: "/gifts?brand=swiss-military" },
    { name: "Sony", src: "/brands/sony.svg", href: "/gifts?brand=sony" },
  ];

  const sequence = buildBrandMarqueeSequence(brands);
  assert.deepEqual(sequence.map(({ brand, decorative }) => [brand.name, decorative === true]), [
    ["Monkcraft", false],
    ["Adidas", false],
    ["Swiss Military", false],
    ["Monkcraft", true],
    ["Sony", false],
  ]);

  const component = fs.readFileSync(path.join(process.cwd(), "src/components/BrandLogoMarquee.tsx"), "utf8");
  assert.equal((component.match(/trackBrands\.map/g) || []).length, 2, "both loop halves use the exact same sequence");
  assert.match(component, /aria-hidden="true"/);
});
