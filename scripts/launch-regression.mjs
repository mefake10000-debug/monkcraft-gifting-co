/**
 * Lightweight launch regression probes (no extra deps).
 * Usage: node scripts/launch-regression.mjs [baseUrl]
 * Default baseUrl: http://127.0.0.1:3000
 */

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");

async function req(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-json */
  }
  return { status: res.status, json, text: text.slice(0, 200) };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: String(err.message || err) });
    console.error(`FAIL  ${name}: ${err.message || err}`);
  }
}

await check("GET /api/enquiry → delivery_not_configured", async () => {
  const r = await req("GET", "/api/enquiry");
  assert(r.status === 200, `status ${r.status}`);
  assert(r.json?.deliveryConfigured === false, "delivery should be off");
  assert(r.json?.code === "delivery_not_configured", "code mismatch");
});

await check("POST /api/enquiry valid → 503 not delivered", async () => {
  const r = await req("POST", "/api/enquiry", {
    name: "Launch Regression",
    company: "Monkcraft QA",
    email: "qa@example.com",
    summary:
      "Regression probe: 50 onboarding kits, budget under ₹500. Not a real enquiry.",
    source: "launch-regression",
    clientSubmissionId: `reg-${Date.now()}`,
    website: "",
  });
  assert(r.status === 503, `expected 503 got ${r.status}`);
  assert(r.json?.delivered === false, "must not claim delivered");
  assert(r.json?.code === "delivery_not_configured", "code mismatch");
});

await check("POST /api/enquiry honeypot → spam_rejected", async () => {
  const r = await req("POST", "/api/enquiry", {
    name: "Bot",
    company: "Spam",
    email: "bot@example.com",
    summary: "Spam payload with enough characters for the summary field.",
    website: "https://spam.example",
    clientSubmissionId: `spam-${Date.now()}`,
  });
  assert(r.status === 400, `expected 400 got ${r.status}`);
  assert(r.json?.code === "spam_rejected", "honeypot not enforced");
  assert(r.json?.delivered === false, "must not deliver");
});

await check("GET /api/catalogue/search notebook", async () => {
  const r = await req("GET", "/api/catalogue/search?q=notebook&limit=3");
  assert(r.status === 200, `status ${r.status}`);
  assert(Array.isArray(r.json?.products), "products array");
  assert(r.json.products.length > 0, "expected matches");
  assert(r.json.products[0].id, "product id required");
  assert(
    typeof r.json.products[0].amountInr === "number" ||
      r.json.products[0].priceLabel,
    "price label/amount required",
  );
});

await check("POST /api/gift-finder/recommend rule-based", async () => {
  const r = await req("POST", "/api/gift-finder/recommend", {
    requirements: {
      schemaVersion: 1,
      occasionIds: ["employee-onboarding"],
      audience: "employees",
      recipientCount: "50",
      budgetPerRecipientInr: 500,
      budgetTotalInr: null,
      budgetPerRecipientLabel: "₹500",
      categorySlugs: [],
      preferenceKeywords: [],
      brandingPreference: "",
      brandingNotes: "",
      packagingNotes: "",
      deliveryDate: "",
      deliveryLocation: "",
      specialInstructions: "",
      freeText: "",
      updatedAt: "",
    },
  });
  assert(r.status === 200, `status ${r.status}`);
  assert(r.json?.mode === "rule-based", "must stay rule-based");
  assert(Array.isArray(r.json?.matches), "matches array");
  assert(r.json.matches.length > 0, "expected matches");
  const pricing = r.json.matches[0]?.product?.pricing;
  assert(pricing?.kind === "fixed" || pricing?.kind === "quote", "pricing kind");
  if (pricing?.kind === "fixed") {
    assert(pricing.amountInr > 0, "fixed price must be positive");
  }
});

const failed = results.filter((r) => !r.ok);
console.log("---");
console.log(
  `launch-regression: ${results.length - failed.length}/${results.length} passed against ${base}`,
);
process.exit(failed.length ? 1 : 0);
